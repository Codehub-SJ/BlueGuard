import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Plus, MapPin } from "lucide-react";

const reportSchema = z.object({
  type: z.string().min(1, "Report type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportModalProps {
  children: React.ReactNode;
}

export function ReportModal({ children }: ReportModalProps) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type: "",
      title: "",
      description: "",
      location: "",
      priority: "medium",
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: ReportFormData & { photos?: File[] }) => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "photos" && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      formData.append("userId", user?.id || "");
      
      if (photos.length > 0) {
        photos.forEach(photo => formData.append("photos", photo));
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create report");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Report submitted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setOpen(false);
      form.reset();
      setPhotos([]);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to submit report", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + photos.length > 5) {
      toast({ 
        title: "Too many photos", 
        description: "Maximum 5 photos allowed",
        variant: "destructive" 
      });
      return;
    }
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          form.setValue("location", `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
          toast({ title: "Location detected" });
        },
        (error) => {
          toast({ 
            title: "Location access denied", 
            description: "Please enter location manually",
            variant: "destructive" 
          });
        }
      );
    }
  };

  const onSubmit = (data: ReportFormData) => {
    createReportMutation.mutate({ ...data, photos });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto" data-testid="report-modal">
        <DialogHeader>
          <DialogTitle>Submit Report</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="report-type-select">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="erosion">Coastal Erosion</SelectItem>
                      <SelectItem value="flooding">High Water Level</SelectItem>
                      <SelectItem value="illegal_mining">Illegal Mining</SelectItem>
                      <SelectItem value="hazard">Environmental Hazard</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the issue" {...field} data-testid="report-title-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input placeholder="Enter location or coordinates" {...field} data-testid="report-location-input" />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      data-testid="get-location-button"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you observed..."
                      rows={3}
                      {...field}
                      data-testid="report-description-textarea"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="report-priority-select">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Photos (Max 5)</label>
              <div className="space-y-3">
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`remove-photo-${index}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <Camera className="text-2xl text-muted-foreground mb-2 mx-auto" />
                  <label className="cursor-pointer">
                    <span className="text-sm text-muted-foreground">
                      Tap to take photos or upload
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                      data-testid="photo-upload-input"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                data-testid="cancel-report-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createReportMutation.isPending}
                data-testid="submit-report-button"
              >
                {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
