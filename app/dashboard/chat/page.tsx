"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const customers = [
  {
    id: "1",
    name: "Alice Johnson",
    avatar: "/avatars/alice.jpg",
    lastMessage: "Hi, I have a question about your services.",
  },
  { id: "2", name: "Bob Smith", avatar: "/avatars/bob.jpg", lastMessage: "When is the next available date?" },
  { id: "3", name: "Carol White", avatar: "/avatars/carol.jpg", lastMessage: "Thank you for your help!" },
  { id: "4", name: "David Brown", avatar: "/avatars/david.jpg", lastMessage: "Can we discuss the pricing?" },
  { id: "5", name: "Eva Green", avatar: "/avatars/eva.jpg", lastMessage: "I'd like to book your services." },
]

const initialMessages = [
  { id: 1, sender: "Customer", content: "Hi, I have a question about your services." },
  { id: 2, sender: "Vendor", content: "Hello! I'd be happy to help. What would you like to know?" },
  { id: 3, sender: "Customer", content: "Do you offer photography services for destination weddings?" },
  {
    id: 4,
    sender: "Vendor",
    content: "Yes, we do! We have experience with destination weddings and can travel to your chosen location.",
  },
]

export default function ChatPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0])
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      setMessages([...messages, { id: messages.length + 1, sender: "Vendor", content: newMessage }])
      setNewMessage("")
    }
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Chat</h1>
      <div className="flex h-[calc(100vh-200px)]">
        <div className="w-1/3 border-r">
          <ScrollArea className="h-full">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedCustomer.id === customer.id ? "bg-gray-100" : ""
                }`}
                onClick={() => setSelectedCustomer(customer)}
              >
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarImage src={customer.avatar} alt={customer.name} />
                  <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{customer.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{customer.lastMessage}</p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
        <div className="w-2/3 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">{selectedCustomer.name}</h2>
          </div>
          <ScrollArea className="flex-grow p-4">
            {messages.map((message) => (
              <div key={message.id} className={`mb-4 ${message.sender === "Vendor" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block p-2 rounded-lg ${
                    message.sender === "Vendor" ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex">
              <Input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow mr-2"
              />
              <Button onClick={handleSendMessage}>Send</Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

