import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { SupabaseConnectionTest } from "@/components/SupabaseConnectionTest";
import logoImage from "@/assets/logo.jpeg";

interface CarouselData {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  order_position: number;
  is_active: boolean;
}

const Index = () => {
  const [carousels, setCarousels] = useState<CarouselData[]>([]);

  useEffect(() => {
    fetchCarousels();
  }, []);

  const fetchCarousels = async () => {
    const { data } = await supabase
      .from("carousels")
      .select("*")
      .eq("is_active", true)
      .order("order_position", { ascending: true });

    if (data) setCarousels(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Debug Component - Remove after fixing connection */}
      <SupabaseConnectionTest />
      
      {/* Header with Logo */}
      <header className="w-full py-8 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto flex justify-center">
          <img 
            src={logoImage} 
            alt="WR Supratman Logo" 
            className="h-32 md:h-40 w-auto object-contain"
          />
        </div>
      </header>
      
      {/* Carousel Section */}
      {carousels.length > 0 && (
        <section className="w-full">
          <Carousel
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent>
              {carousels.map((carousel) => (
                <CarouselItem key={carousel.id}>
                  <div className="relative h-[400px] md:h-[600px] w-full">
                    <img
                      src={carousel.image_url}
                      alt={carousel.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="text-center text-white px-4">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4">{carousel.title}</h1>
                        {carousel.subtitle && (
                          <p className="text-xl md:text-2xl">{carousel.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </section>
      )}

      {/* Content Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Selamat Datang di Website Sekolah</h2>
          <p className="text-lg text-muted-foreground">
            Kelola konten website melalui dashboard admin
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
