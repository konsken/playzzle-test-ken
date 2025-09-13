

'use client';

import { useState, useRef, useTransition, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createCategory, uploadPuzzle } from '@/app/puzzles/actions';
import { useToast } from '@/hooks/use-toast';
import { compressImage, type CompressedImageInfo } from '@/lib/image-compressor';
import { Loader2, Upload, PlusCircle, AlertCircle, Star, Sparkles } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useRouter } from 'next/navigation';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { renamePuzzle } from '@/app/puzzles/actions';


type AdminControlsProps = {
  categories: string[];
};

type LastUploadInfo = {
    src: string;
    filename: string;
    category: string;
    size: number;
    width: number;
    height: number;
}

const MAX_SIZE_MB = 1;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function AdminControls({ categories: initialCategories }: AdminControlsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [categories, setCategories] = useState(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lastUpload, setLastUpload] = useState<LastUploadInfo | null>(null);
  const [isProDialogOpen, setIsProDialogOpen] = useState(false);
  
  // New state for compression options
  const [resizeOption, setResizeOption] = useState<string>('1024');
  const [convertToJpg, setConvertToJpg] = useState(false);
  const [quality, setQuality] = useState([85]);
  
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleCreateCategory = () => {
    if (!newCategoryName) return;
    startTransition(async () => {
      const result = await createCategory(newCategoryName);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setNewCategoryName('');
        // Let the page re-fetch categories instead of manual update
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          const fileList = Array.from(files);
          const invalidFiles = fileList.filter(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type));

          if (invalidFiles.length > 0) {
              setFileError('Invalid file type detected. Please upload only JPG, PNG, or WebP files.');
              setSelectedFiles([]);
          } else {
              setFileError(null);
              setSelectedFiles(fileList);
          }
      } else {
          setSelectedFiles([]);
      }
  }

  const resetUploadForm = () => {
    setSelectedFiles([]);
    setFileError(null);
    setSelectedCategory('');
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleUploadPuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !selectedCategory) {
        toast({ variant: 'destructive', title: 'Missing Info', description: 'Please select a category and at least one file.' });
        return;
    }

    startTransition(async () => {
        const formData = new FormData();
        formData.append('category', selectedCategory);

        const processedFilesInfo: {name: string, width: number, height: number, size: number, localUrl: string}[] = [];

        for (const file of selectedFiles) {
            try {
                const processedImage = await compressImage(file, {
                    quality: quality[0] / 100,
                    targetWidth: resizeOption === 'original' ? null : Number(resizeOption),
                    convertToJpg: convertToJpg,
                });

                if (processedImage.file.size > MAX_SIZE_BYTES) {
                    toast({ variant: 'destructive', title: 'Upload Skipped', description: `${file.name} is too large after compression.` });
                    continue;
                }
                
                formData.append('files', processedImage.file, processedImage.file.name);
                processedFilesInfo.push({
                    name: processedImage.file.name,
                    width: processedImage.width,
                    height: processedImage.height,
                    size: processedImage.file.size,
                    localUrl: URL.createObjectURL(processedImage.file),
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Processing Error', description: `Could not process ${file.name}.` });
            }
        }
        
        // Only proceed if there are files to upload
        if (formData.getAll('files').length === 0) {
            return;
        }

        const result = await uploadPuzzle(formData);
        
        toast({
            title: result.success ? 'Upload Complete' : 'Upload Failed',
            description: result.message,
            variant: result.success ? 'default' : 'destructive'
        });

        resetUploadForm();
        setIsDialogOpen(false);

        if (result.success && result.uploadedFiles.length > 0) {
            const firstUploadedFilename = result.uploadedFiles[0];
            const firstFileInfo = processedFilesInfo.find(f => f.name === firstUploadedFilename);
            if (firstFileInfo) {
                 setLastUpload({
                    src: firstFileInfo.localUrl,
                    filename: firstFileInfo.name,
                    category: selectedCategory,
                    size: firstFileInfo.size,
                    width: firstFileInfo.width,
                    height: firstFileInfo.height,
                });
                setIsProDialogOpen(true);
            }
        } else {
            window.location.reload();
        }
    });
  }
  
  const handleProToggle = () => {
    if (!lastUpload) return;
    startTransition(async () => {
      const result = await renamePuzzle(lastUpload.category, lastUpload.filename, "pro");
      if (result.success) {
        toast({ title: 'Success', description: `Marked ${lastUpload.filename} as Pro.` });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
      setIsProDialogOpen(false);
      setLastUpload(null);
      window.location.reload(); // Refresh page to show updated puzzles
    });
  };
  
  const handleCloseProDialog = () => {
      setIsProDialogOpen(false);
      setLastUpload(null);
      window.location.reload(); // Refresh page to show updated puzzles
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-30">
            <PlusCircle className="h-8 w-8" />
            <span className="sr-only">Add Puzzle or Category</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Admin Controls</DialogTitle>
            <DialogDescription>Add new categories or upload puzzles to the gallery.</DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-8 p-1 pt-4">
              {/* Create Category */}
              <Card>
                  <CardHeader>
                      <CardTitle>Create New Category</CardTitle>
                      <CardDescription>Add a new category for puzzles.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="category-name">New Category Name</Label>
                       <Input
                          id="category-name"
                          placeholder="e.g., vintage-cars"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                       />
                       <p className="text-xs text-muted-foreground">Use lowercase letters, numbers, and hyphens only.</p>
                     </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleCreateCategory} disabled={isPending || !newCategoryName}>
                      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                       Create Category
                     </Button>
                  </CardFooter>
              </Card>

               {/* Upload Puzzle */}
              <Card>
                   <CardHeader>
                      <CardTitle>Upload New Puzzle(s)</CardTitle>
                      <CardDescription>Upload one or more images to an existing category.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <form ref={uploadFormRef} onSubmit={handleUploadPuzzle} className="space-y-6">
                          <div className="space-y-2">
                              <Label htmlFor="category-select">Category</Label>
                              <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                                  <SelectTrigger id="category-select">
                                      <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {categories.map(cat => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          
                          <div className="space-y-2">
                              <Label>Compression Options</Label>
                              <div className="p-4 border rounded-md space-y-4">
                                  <div className="space-y-2">
                                      <Label>Resize to Width</Label>
                                      <RadioGroup defaultValue={resizeOption} onValueChange={setResizeOption}>
                                          <div className="flex items-center space-x-2">
                                              <RadioGroupItem value="original" id="r-original" />
                                              <Label htmlFor="r-original">Original</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                              <RadioGroupItem value="1024" id="r-1024" />
                                              <Label htmlFor="r-1024">1024px</Label>
                                          </div>
                                           <div className="flex items-center space-x-2">
                                              <RadioGroupItem value="500" id="r-500" />
                                              <Label htmlFor="r-500">500px</Label>
                                          </div>
                                      </RadioGroup>
                                  </div>
                                   <div className="space-y-2">
                                      <Label>Quality ({quality[0]}%)</Label>
                                      <Slider defaultValue={quality} onValueChange={setQuality} max={100} step={5} />
                                   </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch id="convert-jpg" checked={convertToJpg} onCheckedChange={setConvertToJpg} />
                                      <Label htmlFor="convert-jpg">Convert PNG to JPG</Label>
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-2">
                              <Label htmlFor="puzzle-upload">Puzzle Image(s)</Label>
                              <Input 
                                ref={fileInputRef} 
                                id="puzzle-upload" 
                                type="file" 
                                accept="image/jpeg,image/png,image/webp" 
                                onChange={handleFileChange} 
                                multiple
                              />
                          </div>
                          {selectedFiles.length > 0 && (
                            <div className="text-sm text-muted-foreground p-2 border rounded-md max-h-24 overflow-y-auto">
                              <p className="font-semibold mb-1">{selectedFiles.length} file(s) selected:</p>
                              <ul className="list-disc pl-5">
                                {selectedFiles.map(file => (
                                  <li key={file.name} className="truncate">{file.name} ({formatBytes(file.size)})</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {fileError && (
                             <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>File Error</AlertTitle>
                                <AlertDescription>{fileError}</AlertDescription>
                              </Alert>
                          )}
                          <Button type="submit" disabled={isPending || selectedFiles.length === 0 || !selectedCategory || !!fileError}>
                              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                              Upload {selectedFiles.length > 0 ? selectedFiles.length : ''} Puzzle(s)
                          </Button>
                      </form>
                  </CardContent>
              </Card>
          </div>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={isProDialogOpen} onOpenChange={setIsProDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Upload(s) Successful!</AlertDialogTitle>
                    <AlertDialogDescription>
                       The puzzle(s) have been added. Would you like to mark the first uploaded puzzle as "Pro"?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                    {lastUpload && (
                        <div className="flex items-center gap-4 p-4 rounded-md border bg-muted">
                            <img src={lastUpload.src} alt="Uploaded Puzzle" className="w-24 h-32 object-cover rounded-md" />
                            <div className="text-sm">
                                <p className="font-semibold">{lastUpload.filename}</p>
                                <p className="text-muted-foreground">{lastUpload.category}</p>
                                <p className="text-muted-foreground mt-2">
                                    Size: <span className="font-mono">{formatBytes(lastUpload.size)}</span>
                                </p>
                                <p className="text-muted-foreground">
                                    Dimensions: <span className="font-mono">{lastUpload.width}x{lastUpload.height}px</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCloseProDialog} disabled={isPending}>No, Keep Standard</AlertDialogCancel>
                    <AlertDialogAction onClick={handleProToggle} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                         Yes, Make it Pro
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
