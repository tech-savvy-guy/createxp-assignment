"use client"

import type React from "react"
import { format } from 'date-fns';
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { ArrowDownAZ, ArrowUpAZ, Bell, Calendar, Filter, Moon, Plus, Search, Sun, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useMediaQuery } from "@/hooks/use-mobile"
import { toast } from "sonner"
import { mockClients } from "@/lib/data"
import { Client, SortField, SortDirection, SortOption } from "@/lib/types"

const defaultSortOptions: {
  field: SortField
  label: string
  icon: React.ReactNode
  options: { label: string; direction: SortDirection; icon: React.ReactNode }[]
}[] = [
    {
      field: "name",
      label: "Name",
      icon: <ArrowDownAZ className="h-4 w-4" />,
      options: [
        { label: "A-Z", direction: "asc", icon: <ArrowUpAZ className="h-4 w-4" /> },
        { label: "Z-A", direction: "desc", icon: <ArrowDownAZ className="h-4 w-4" /> },
      ],
    },

    {
      field: "id",
      label: "Client ID",
      icon: <ArrowDownAZ className="h-4 w-4" />,
      options: [
        { label: "A-Z", direction: "asc", icon: <ArrowUpAZ className="h-4 w-4" /> },
        { label: "Z-A", direction: "desc", icon: <ArrowDownAZ className="h-4 w-4" /> },
      ],
    },

    {
      field: "updatedAt",
      label: "Updated On",
      icon: <Calendar className="h-4 w-4" />,
      options: [
        { label: "Newest First", direction: "desc", icon: <ArrowUpAZ className="h-4 w-4" /> },
        { label: "Oldest First", direction: "asc", icon: <ArrowDownAZ className="h-4 w-4" /> },
      ],
    },

  ]

function SortableOptionGroup({
  option,
  isSortActive,
  toggleSort,
}: {
  option: (typeof defaultSortOptions)[0]
  isSortActive: (field: SortField, direction: SortDirection) => boolean
  toggleSort: (field: SortField, direction: SortDirection) => void
}) {
  const isActive = option.options.some((opt) => isSortActive(option.field, opt.direction))

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.field,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center py-2.5 transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground",
        isDragging && "opacity-80 bg-muted rounded-md",
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 mr-2">
        <GripVertical size={14} className="text-muted-foreground" />
      </div>

      <div className="flex items-center">
        {option.icon}
        <span className="text-xs ml-2">{option.label}</span>
      </div>

      <div className="flex ml-auto gap-1.5 flex-wrap justify-end">
        {option.options.map((opt) => {
          const isActive = isSortActive(option.field, opt.direction)
          return (
            <Button
              key={`${option.field}-${opt.direction}`}
              variant="outline"
              size="sm"
              className={cn(
                "text-xs px-2 py-0.5 h-6 transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground border-border"
                  : "bg-transparent text-muted-foreground border-border"
              )}
              onClick={() => toggleSort(option.field, opt.direction)}
            >
              {opt.direction === "asc" ? "↑" : "↓"} {opt.label}
              {isActive && (
                <X
                  className="h-3 w-3 ml-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSort(option.field, opt.direction)
                  }}
                />
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function ClientCard({
  client,
  getStatusColor,
}: { client: Client; getStatusColor: (status: Client["status"]) => string }) {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium">{client.name}</h3>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
          <Badge variant="outline" className={cn("capitalize", getStatusColor(client.status))}>
            {client.status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">ID:</p>
            <p className="font-medium">{client.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type:</p>
            <p>{client.type}</p>
          </div>
          <div className="col-span-2 flex items-center justify-between mt-2 pt-2 border-t">
            <span className="text-muted-foreground text-xs">Updated: {client.updatedAt.toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ClientListTable() {

  const { setTheme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState("light")
  const [activeTab, setActiveTab] = useState("all")
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [activeSorts, setActiveSorts] = useState<SortOption[]>([])
  const [clients, setClients] = useState<Client[]>(mockClients)
  const [notifications] = useState(2)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOptions, setSortOptions] = useState(defaultSortOptions)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const isMobile = useMediaQuery("(max-width: 768px)")

  const [showCopyEmail, setShowCopyEmail] = useState(true);

  const handleCTA = () => {
    if (showCopyEmail) {
      toast('Impressed yet? Hire me :)', {
        description: 'Email: dattasoham805@gmail.com',
        action: {
          label: 'Copy',
          onClick: () => {
            navigator.clipboard.writeText('dattasoham805@gmail.com');
            toast.success('Email copied to clipboard!');
          },
        },
      });
    } else {
      toast('Want to talk? Call me!', {
        description: 'Phone: +91 9330089488',
        action: {
          label: 'Call Me',
          onClick: () => {
            window.open('tel:+919330089488');
          },
        },
      });
    }
    setShowCopyEmail(!showCopyEmail);
  };

  // Load sort criteria from localStorage on mount
  useEffect(() => {
    try {
      const savedSorts = localStorage.getItem("clientTableSorts")
      if (savedSorts) {
        setActiveSorts(JSON.parse(savedSorts))
      }
    } catch (e) {
      console.error("Failed to parse saved sort criteria", e)
      // If there's an error, clear localStorage to prevent future errors
      localStorage.removeItem("clientTableSorts")
    }
  }, [])

  // Save sort criteria to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("clientTableSorts", JSON.stringify(activeSorts))
    } catch (e) {
      console.error("Failed to save sort criteria to localStorage", e)
    }
  }, [activeSorts])

  // Load sort options order from localStorage on mount
  useEffect(() => {
    try {
      const savedSortOptionsOrder = localStorage.getItem("clientTableSortOptionsOrder")
      if (savedSortOptionsOrder) {
        // We only save the order of fields, not the entire options with React elements
        const savedOrder = JSON.parse(savedSortOptionsOrder) as SortField[]

        // Reorder the default options based on the saved order
        const reorderedOptions = [...defaultSortOptions].sort((a, b) => {
          const indexA = savedOrder.indexOf(a.field)
          const indexB = savedOrder.indexOf(b.field)
          return indexA - indexB
        })

        setSortOptions(reorderedOptions)
      }
    } catch (e) {
      console.error("Failed to parse saved sort options order", e)
      localStorage.removeItem("clientTableSortOptionsOrder")
    }
  }, [])

  // Save sort options order to localStorage when it changes
  useEffect(() => {
    try {
      // Only save the order of fields, not the entire options with React elements
      const orderToSave = sortOptions.map((option) => option.field)
      localStorage.setItem("clientTableSortOptionsOrder", JSON.stringify(orderToSave))
    } catch (e) {
      console.error("Failed to save sort options order to localStorage", e)
    }

    // When sort options order changes, update active sorts to match the new priority
    if (activeSorts.length > 0) {
      // Re-sort the table data
      setClients(sortClients(clients, activeSorts))
    }
  }, [sortOptions])

  // Filter clients based on active tab and search query
  useEffect(() => {
    let filtered = mockClients

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((client) => client.type.toLowerCase() === activeTab.toLowerCase())
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          client.id.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    setClients(sortClients(filtered, activeSorts))
  }, [activeTab, activeSorts, searchQuery])

  // Sort clients based on active sorts and sort options priority
  const sortClients = (clientsToSort: Client[], sorts: SortOption[]): Client[] => {
    if (sorts.length === 0) return clientsToSort

    return [...clientsToSort].sort((a, b) => {
      // Create a prioritized list of sorts based on the order of sort options
      const prioritizedSorts = [...sorts].sort((sortA, sortB) => {
        const indexA = sortOptions.findIndex((option) => option.field === sortA.field)
        const indexB = sortOptions.findIndex((option) => option.field === sortB.field)
        return indexA - indexB
      })

      // Apply sorts in priority order
      for (const sort of prioritizedSorts) {
        const { field, direction } = sort

        const aValue = a[field]
        const bValue = b[field]

        // Skip to next criterion if values are equal
        if (aValue === bValue) continue

        // Handle different types of values
        if (aValue instanceof Date && bValue instanceof Date) {
          const comparison = aValue.getTime() - bValue.getTime()
          if (comparison !== 0) {
            return direction === "asc" ? comparison : -comparison
          }
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue)
          if (comparison !== 0) {
            return direction === "asc" ? comparison : -comparison
          }
        } else {
          // Generic comparison for other types
          const comparison = aValue < bValue ? -1 : 1
          // @ts-ignore
          if (comparison !== 0) {
            return direction === "asc" ? comparison : -comparison
          }
        }
      }
      return 0
    })
  }

  // Toggle sort option
  const toggleSort = (field: SortField, direction: SortDirection) => {
    // Check if this sort is already active
    const existingIndex = activeSorts.findIndex((sort) => sort.field === field)

    if (existingIndex >= 0) {
      // If direction is the same, remove it
      if (activeSorts[existingIndex].direction === direction) {
        setActiveSorts(activeSorts.filter((sort) => sort.field !== field))
      } else {
        // Update direction
        const newSorts = [...activeSorts]
        newSorts[existingIndex] = { field, direction }
        setActiveSorts(newSorts)
      }
    } else {
      // Add new sort
      setActiveSorts([...activeSorts, { field, direction }])
    }
  }

  // Clear all sorts
  const clearAllSorts = () => {
    setActiveSorts([])
  }

  // Apply sorts and close menu
  const applySorts = () => {
    setSortMenuOpen(false)
    setFilterSheetOpen(false)
  }

  // Get status badge color
  const getStatusColor = (status: Client["status"]) => {
    const colorMap = {
      active: {
        light: "bg-green-100 text-green-800",
        dark: "dark:bg-green-900 dark:text-green-100",
      },
      inactive: {
        light: "bg-gray-100 text-gray-800",
        dark: "dark:bg-gray-800 dark:text-gray-100",
      },
      pending: {
        light: "bg-yellow-100 text-yellow-800",
        dark: "dark:bg-yellow-900 dark:text-yellow-100",
      },
    }

    const colors = colorMap[status as keyof typeof colorMap]
    return colors ? `${colors.light} ${colors.dark}` : ""
  }


  // Check if a sort option is active
  const isSortActive = (field: SortField, direction: SortDirection) => {
    return activeSorts.some((sort) => sort.field === field && sort.direction === direction)
  }

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Handle drag end event for sort options
  const handleSortOptionsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSortOptions((items) => {
        const oldIndex = items.findIndex((option) => option.field === active.id)
        const newIndex = items.findIndex((option) => option.field === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setActiveSorts((items) => {
        const oldIndex = items.findIndex((item) => `${item.field}-${item.direction}` === active.id)
        const newIndex = items.findIndex((item) => `${item.field}-${item.direction}` === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light"
    setCurrentTheme(newTheme)
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b px-4 md:px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Main content */}
      <div className="p-4 md:p-6">
        {/* Tabs and actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="all" className="flex-1 md:flex-none px-4 md:px-6">
                All
              </TabsTrigger>
              <TabsTrigger value="individual" className="flex-1 md:flex-none px-4 md:px-6">
                Individual
              </TabsTrigger>
              <TabsTrigger value="company" className="flex-1 md:flex-none px-4 md:px-6">
                Company
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full md:w-[200px] pl-8 rounded-md"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>

            <div className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {notifications}
                  </span>
                )}
              </Button>
            </div>

            {isMobile ? (
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[90%] sm:w-[450px] p-4">
                  <h3 className="font-medium text-sm mb-4">Sorting Options</h3>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSortOptionsDragEnd}>
                    <SortableContext
                      items={sortOptions.map((option) => option.field)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1 divide-y">
                        {sortOptions.map((option) => (
                          <SortableOptionGroup
                            key={option.field}
                            option={option}
                            isSortActive={isSortActive}
                            toggleSort={toggleSort}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllSorts}
                      className="text-xs"
                    >
                      <X />
                      Clear all
                    </Button>
                    <Button onClick={applySorts} className="text-xs">
                      Apply Sort
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Popover open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-4" align="end">
                  <h3 className="font-medium text-sm mb-4">Sort By</h3>

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSortOptionsDragEnd}>
                    <SortableContext
                      items={sortOptions.map((option) => option.field)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1 divide-y">
                        {sortOptions.map((option) => (
                          <SortableOptionGroup
                            key={option.field}
                            option={option}
                            isSortActive={isSortActive}
                            toggleSort={toggleSort}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllSorts}
                      className="text-xs"
                    >
                      <X />
                      Clear all
                    </Button>
                    <Button onClick={applySorts} className="text-xs">
                      Apply Sort
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <Button className="gap-1 ml-auto md:ml-0" onClick={handleCTA}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Client</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Table for desktop, cards for mobile */}
        {isMobile ? (
          <div className="space-y-3">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} getStatusColor={getStatusColor} />
            ))}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Client Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Updated On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{client.id}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.type}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getStatusColor(client.status))}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">{format(client.updatedAt, 'do MMM, yyyy')}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      {/* Copyright Footer */}
      <footer className="mt-auto border-t py-4 px-6 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()}{' '}
          <a
            href="https://www.sohamdatta.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Soham Datta
          </a>
          . All rights reserved.
        </p>
      </footer>

    </div>
  )
}
