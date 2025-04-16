export type Client = {
    id: string
    name: string
    email: string
    type: "Individual" | "Company"
    status: "active" | "inactive" | "pending"
    createdAt: Date
    updatedAt: Date
}

export type SortField = "id" | "name" | "email" | "type" | "status" | "createdAt" | "updatedAt"
export type SortDirection = "asc" | "desc"

export type SortOption = {
    field: SortField
    direction: SortDirection
}
