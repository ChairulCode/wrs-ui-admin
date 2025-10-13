-- Step 1: Create app_role enum
CREATE TYPE public.app_role AS ENUM ('viewer', 'admin', 'superadmin');

-- Step 2: Create user_roles table (proper role storage)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 4: Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'superadmin' THEN 3
      WHEN 'admin' THEN 2
      WHEN 'viewer' THEN 1
    END DESC
  LIMIT 1
$$;

-- Step 5: Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT id, 
  CASE 
    WHEN role = 'superadmin'::user_role THEN 'superadmin'::app_role
    WHEN role = 'admin'::user_role THEN 'admin'::app_role
    ELSE 'viewer'::app_role
  END,
  created_at
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: Update handle_new_user trigger to assign default viewer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles (no role here anymore)
  INSERT INTO public.profiles (id, full_name, email, school_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'school_level')::public.school_level, NULL)
  );
  
  -- Assign default viewer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  RETURN NEW;
END;
$$;

-- Step 7: RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can assign roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'superadmin'));

-- Step 8: Protect profiles table from direct manipulation
CREATE POLICY "Prevent direct profile inserts"
  ON public.profiles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Prevent profile deletion"
  ON public.profiles FOR DELETE
  USING (false);

-- Step 9: Update RLS policies to use security definer functions
DROP POLICY IF EXISTS "Admins can manage their school level about" ON public.about;
CREATE POLICY "Admins can manage their school level about"
  ON public.about FOR ALL
  USING (
    public.has_role(auth.uid(), 'superadmin') OR
    (public.has_role(auth.uid(), 'admin') AND 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_level = about.school_level))
  );

DROP POLICY IF EXISTS "Admins can manage their school level achievements" ON public.achievements;
CREATE POLICY "Admins can manage their school level achievements"
  ON public.achievements FOR ALL
  USING (
    public.has_role(auth.uid(), 'superadmin') OR
    (public.has_role(auth.uid(), 'admin') AND 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_level = achievements.school_level))
  );

DROP POLICY IF EXISTS "Admins can manage their school level activities" ON public.activities;
CREATE POLICY "Admins can manage their school level activities"
  ON public.activities FOR ALL
  USING (
    public.has_role(auth.uid(), 'superadmin') OR
    (public.has_role(auth.uid(), 'admin') AND 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_level = activities.school_level))
  );

DROP POLICY IF EXISTS "Admins can manage their school level announcements" ON public.announcements;
CREATE POLICY "Admins can manage their school level announcements"
  ON public.announcements FOR ALL
  USING (
    public.has_role(auth.uid(), 'superadmin') OR
    (public.has_role(auth.uid(), 'admin') AND 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_level = announcements.school_level))
  );

DROP POLICY IF EXISTS "Admins can manage their school level grade promotions" ON public.grade_promotions;
CREATE POLICY "Admins can manage their school level grade promotions"
  ON public.grade_promotions FOR ALL
  USING (
    public.has_role(auth.uid(), 'superadmin') OR
    (public.has_role(auth.uid(), 'admin') AND 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_level = grade_promotions.school_level))
  );

DROP POLICY IF EXISTS "Admins can view their school level grade promotions" ON public.grade_promotions;
CREATE POLICY "Admins can view their school level grade promotions"
  ON public.grade_promotions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'superadmin') OR
    (public.has_role(auth.uid(), 'admin') AND 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_level = grade_promotions.school_level))
  );

DROP POLICY IF EXISTS "Admins can manage their school level subject grades" ON public.subject_grades;
CREATE POLICY "Admins can manage their school level subject grades"
  ON public.subject_grades FOR ALL
  USING (
    public.has_role(auth.uid(), 'superadmin') OR
    (public.has_role(auth.uid(), 'admin') AND 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_level = subject_grades.school_level))
  );

DROP POLICY IF EXISTS "Admins can view their school level subject grades" ON public.subject_grades;
CREATE POLICY "Admins can view their school level subject grades"
  ON public.subject_grades FOR SELECT
  USING (
    public.has_role(auth.uid(), 'superadmin') OR
    (public.has_role(auth.uid(), 'admin') AND 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_level = subject_grades.school_level))
  );

-- Step 10: Fix storage policies - Only superadmin can manage carousel images
DROP POLICY IF EXISTS "Authenticated users can upload carousel images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update carousel images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete carousel images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view carousel images" ON storage.objects;

CREATE POLICY "Superadmin can upload carousel images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'carousel-images' AND
    public.has_role(auth.uid(), 'superadmin')
  );

CREATE POLICY "Superadmin can update carousel images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'carousel-images' AND
    public.has_role(auth.uid(), 'superadmin')
  );

CREATE POLICY "Superadmin can delete carousel images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'carousel-images' AND
    public.has_role(auth.uid(), 'superadmin')
  );

CREATE POLICY "Anyone can view carousel images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'carousel-images');

-- Step 11: Update carousels RLS policy
DROP POLICY IF EXISTS "Superadmin can manage carousels" ON public.carousels;
CREATE POLICY "Superadmin can manage carousels"
  ON public.carousels FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'));