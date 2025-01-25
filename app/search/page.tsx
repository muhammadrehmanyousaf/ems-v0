import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SearchResults({
  searchParams,
}: {
  searchParams: { q: string }
}) {
  const searchQuery = searchParams.q

  // This is a placeholder for actual search functionality
  const searchResults = [
    { id: 1, title: "Sample Vendor 1", category: "Photographer" },
    { id: 2, title: "Sample Venue 1", category: "Venue" },
    { id: 3, title: "Sample Vendor 2", category: "Caterer" },
  ]

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Search Results for "{searchQuery}"</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {searchResults.map((result) => (
          <Card key={result.id}>
            <CardHeader>
              <CardTitle>{result.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Category: {result.category}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

