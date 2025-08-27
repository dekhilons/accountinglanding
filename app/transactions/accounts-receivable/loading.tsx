import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
            <div className="flex space-x-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-32" />
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
