import ThreeDImageGallery from "@/components/ui/3d-image-gallery"

const demoCards = [
  {
    id: "d-1",
    title: "Demo Ilan",
    city: "Istanbul",
    distanceKm: 2.1,
    category: "Demo",
    summary: "Ornek kart gorunumu.",
    imageUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
  },
]

export default function DemoOne() {
  return <ThreeDImageGallery cards={demoCards} />
}
