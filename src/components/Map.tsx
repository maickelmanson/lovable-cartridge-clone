import { cn } from "@/lib/utils";

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: unknown) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  return (
    <div
      className={cn(
        "w-full h-[500px] bg-muted flex items-center justify-center rounded-md",
        className
      )}
    >
      <div className="text-center text-muted-foreground">
        <p className="font-medium">Mapa indisponível</p>
        <p className="text-sm">
          Centro: {initialCenter.lat}, {initialCenter.lng} | Zoom: {initialZoom}
        </p>
      </div>
    </div>
  );
}
