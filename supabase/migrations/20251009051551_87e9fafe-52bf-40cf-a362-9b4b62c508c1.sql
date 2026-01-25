-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin');

-- Create enum for school levels
CREATE TYPE public.school_level AS ENUM ('tk', 'sd', 'smp', 'sma');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'admin',
  school_level public.school_level,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, school_level)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'admin'),
    COALESCE((new.raw_user_meta_data->>'school_level')::public.school_level, NULL)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create carousel table
CREATE TABLE public.carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  order_position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active carousels"
  ON public.carousels FOR SELECT
  USING (is_active = true);

CREATE POLICY "Superadmin can manage carousels"
  ON public.carousels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
    )
  );

-- Create about/profile table
CREATE TABLE public.about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_level public.school_level NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  vision TEXT,
  mission TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_level)
);

ALTER TABLE public.about ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view about"
  ON public.about FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage their school level about"
  ON public.about FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'superadmin' OR profiles.school_level = about.school_level)
    )
  );

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_level public.school_level NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  achievement_date DATE NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage their school level achievements"
  ON public.achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'superadmin' OR profiles.school_level = achievements.school_level)
    )
  );

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_level public.school_level NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  activity_date DATE NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activities"
  ON public.activities FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage their school level activities"
  ON public.activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'superadmin' OR profiles.school_level = activities.school_level)
    )
  );

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_level public.school_level NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_date DATE NOT NULL,
  is_important BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view announcements"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage their school level announcements"
  ON public.announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'superadmin' OR profiles.school_level = announcements.school_level)
    )
  );

-- Create grade promotions table
CREATE TABLE public.grade_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_level public.school_level NOT NULL,
  academic_year TEXT NOT NULL,
  student_name TEXT NOT NULL,
  current_grade TEXT NOT NULL,
  promoted_grade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'promoted',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.grade_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their school level grade promotions"
  ON public.grade_promotions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'superadmin' OR profiles.school_level = grade_promotions.school_level)
    )
  );

CREATE POLICY "Admins can manage their school level grade promotions"
  ON public.grade_promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'superadmin' OR profiles.school_level = grade_promotions.school_level)
    )
  );

-- Create subject grades table
CREATE TABLE public.subject_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_level public.school_level NOT NULL,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subject_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their school level subject grades"
  ON public.subject_grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'superadmin' OR profiles.school_level = subject_grades.school_level)
    )
  );

CREATE POLICY "Admins can manage their school level subject grades"
  ON public.subject_grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'superadmin' OR profiles.school_level = subject_grades.school_level)
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carousels_updated_at BEFORE UPDATE ON public.carousels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_about_updated_at BEFORE UPDATE ON public.about
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade_promotions_updated_at BEFORE UPDATE ON public.grade_promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subject_grades_updated_at BEFORE UPDATE ON public.subject_grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();