import { Client } from "@/lib/types";

export const mockClients: Client[] = [
    {
        id: "20",
        name: "John Doe",
        email: "johndoe@email.com",
        type: "Individual",
        status: "active",
        createdAt: new Date("2023-01-15"),
        updatedAt: new Date("2023-06-20"),
    },
    {
        id: "21",
        name: "Test Test",
        email: "test@test.com",
        type: "Individual",
        status: "pending",
        createdAt: new Date("2023-02-10"),
        updatedAt: new Date("2023-05-15"),
    },
    {
        id: "22",
        name: "Acme Corp",
        email: "info@acme.com",
        type: "Company",
        status: "active",
        createdAt: new Date("2023-03-05"),
        updatedAt: new Date("2023-07-01"),
    },
    {
        id: "23",
        name: "Jane Smith",
        email: "jane@example.com",
        type: "Individual",
        status: "inactive",
        createdAt: new Date("2023-01-20"),
        updatedAt: new Date("2023-04-10"),
    },
    {
        id: "24",
        name: "Global Industries",
        email: "contact@global.com",
        type: "Company",
        status: "active",
        createdAt: new Date("2023-02-25"),
        updatedAt: new Date("2023-06-15"),
    },
]
