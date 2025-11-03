import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface ContractFormProps {
  open: boolean;
  freelancer?: any;
  onClose: () => void;
}

export function ContractForm({ open, freelancer, onClose }: ContractFormProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle contract submission
    onClose();
  };

  if (!freelancer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Contract Offer</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={freelancer.img} />
            <AvatarFallback>{freelancer.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold">{freelancer.name}</h4>
            <p className="text-sm text-muted-foreground">{freelancer.title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="contractTitle">Contract Title</Label>
            <Input
              id="contractTitle"
              placeholder="e.g. E-commerce Website Development"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Work Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the work to be performed..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select defaultValue="fixed">
                <SelectTrigger id="paymentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="milestone">Milestone-based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="5000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestones">Number of Milestones</Label>
            <Select defaultValue="1">
              <SelectTrigger id="milestones">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Milestone</SelectItem>
                <SelectItem value="2">2 Milestones</SelectItem>
                <SelectItem value="3">3 Milestones</SelectItem>
                <SelectItem value="4">4 Milestones</SelectItem>
                <SelectItem value="5">5+ Milestones</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Contract Terms & Conditions</Label>
            <Textarea
              id="terms"
              placeholder="Add any specific terms, deliverables, or conditions..."
              rows={4}
            />
          </div>

          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Contract Summary</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Payment will be held in escrow until work is completed</p>
              <p>• Freelancer can dispute if work is rejected</p>
              <p>• Platform fee: 10% of contract value</p>
              <p>• Contract can be modified with mutual agreement</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Send Contract Offer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
