
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Copy,
  Check,
  MoreHorizontal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Inline SVG for WhatsApp as it's not in lucide-react
const WhatsAppIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-message-circle"
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.38 1.25 4.81l-1.34 4.91 5.04-1.32c1.38.74 2.94 1.18 4.58 1.18h.01c5.46 0 9.91-4.45 9.91-9.91s-4.45-9.91-9.91-9.91zM17.17 14.3c-.2-.1-.58-.29-.67-.32s-.31-.05-.44.05-.5.58-.61.7s-.22.15-.41.05c-.19-.1-.82-.3-1.56-.96-.58-.52-1.03-1.17-1.15-1.37s-.12-.31-.01-.41c.09-.09.2-.23.3-.34.09-.1.12-.17.18-.28.06-.11.03-.21 0-.31s-.44-1.06-.6-1.45c-.16-.39-.33-.34-.45-.34h-.21c-.12 0-.31.05-.47.25s-.6.58-.6 1.42.61 1.65.7 1.77c.09.12 1.21 1.86 2.96 2.61.42.18.76.29 1.02.37.5.17.95.14 1.3.09.39-.05 1.21-.49 1.38-.97.17-.48.17-.89.12-.97-.05-.08-.18-.13-.38-.23z" />
    </svg>
  );

const PinterestIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
        <path d="M12.017 1.987c-5.22.02-9.437 4.39-9.437 9.875 0 3.593 1.81 6.786 4.545 8.527v-5.63A4.5 4.5 0 0 1 11.25 9.5a4.5 4.5 0 0 1 4.5 4.5c0 1.91-1.125 3.375-2.625 3.375-.99 0-1.74-.788-1.53-1.785.255-1.185.87-3.48.87-3.48s-.225-.45-.225-1.125c0-1.05.9-1.845 2.025-1.845 1.455 0 2.13.99 2.13 2.58 0 1.56-.945 3.9-2.385 3.9-1.83 0-3.015-1.485-3.015-3.345 0-1.425.99-2.49 2.22-2.49.585 0 1.05.285 1.05.63 0 .285-.195.93-.285 1.32-.105.45-.165.615-.555.615-.42 0-.735-.885-.735-1.665 0-1.32.99-2.73 3.36-2.73 3.03 0 4.905 2.145 4.905 5.04 0 3.315-1.92 6.27-5.415 6.27-3.795 0-6.27-2.67-6.27-5.925 0-1.995.825-3.465 2.025-4.32a.25.25 0 0 1 .315.015z"/>
    </svg>
);

type ShareButtonProps = {
  slug: string;
  time: string;
  imageSrc: string | null;
  imageFilename: string;
};

export default function ShareButton({ slug, time, imageSrc, imageFilename }: ShareButtonProps) {
  const [url, setUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const [isWebShareSupported, setIsWebShareSupported] = useState(false);
  
  useEffect(() => {
    // This component is only rendered on the client, so window is safe to use.
    setUrl(window.location.href);
    if (navigator.share) {
        setIsWebShareSupported(true);
    }
  }, []);
  
  const text = `I solved the puzzle in ${time}! Can you beat me?`;
  const fullShareText = `${text} ${url}`;

  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const absoluteImageUrl = imageSrc ? new URL(imageSrc, siteUrl).href : '';
  const encodedImage = encodeURIComponent(absoluteImageUrl);

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'Twitter', icon: Twitter, url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}` },
    { name: 'LinkedIn', icon: Linkedin, url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodeURIComponent("I solved a Playzzle!")}` },
    { name: 'WhatsApp', icon: WhatsAppIcon, url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}` },
    { name: 'Pinterest', icon: PinterestIcon, url: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedText}` },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShareText).then(() => {
      setIsCopied(true);
      toast({ title: 'Copied!', description: 'Link and text copied to clipboard.' });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleNativeShare = async () => {
    try {
        await navigator.share({
            title: "I solved a Playzzle!",
            text: fullShareText,
            url: url,
        });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
         console.error('Native sharing failed:', error.message);
         toast({ variant: 'destructive', title: 'Share Failed', description: 'Could not open share dialog.' });
        }
    }
  };


  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <div className="flex items-center gap-2">
          {socialLinks.map((social) => (
            <Button
              key={social.name}
              variant="outline"
              size="icon"
              asChild
            >
              <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${social.name}`}>
                <social.icon />
              </a>
            </Button>
          ))}
          <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy link">
            {isCopied ? <Check className="text-green-500" /> : <Copy />}
          </Button>
          {isWebShareSupported && (
             <Button variant="outline" size="icon" onClick={handleNativeShare} aria-label="More options">
                <MoreHorizontal />
             </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
    