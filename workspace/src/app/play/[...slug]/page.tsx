import DynamicPuzzleGame from '@/components/dynamic-puzzle-game';
import { Metadata } from 'next';

type PlayPageProps = {
  params: {
    slug: string[];
  };
};

// This function generates metadata for the page.
export async function generateMetadata({ params }: PlayPageProps): Promise<Metadata> {
  if (!params.slug || params.slug.length === 0) {
    return {
      title: 'Invalid Puzzle',
    };
  }
  
  const imagePath = `/puzzles/${params.slug.map(segment => decodeURIComponent(segment)).join('/')}`;
  
  const title = "I'm playing Piczzle!";
  const description = "Check out this fun puzzle I'm solving on Piczzle. Can you beat my time?";

  // Social media crawlers require an absolute URL to fetch the image for previews.
  // Using metadataBase allows Next.js to construct the full URL from an environment variable.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    metadataBase: new URL(siteUrl),
    title: 'Play Piczzle!',
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: imagePath,
          width: 800,
          height: 600,
          alt: 'A Piczzle puzzle image'
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imagePath],
    },
  };
}


export default function PlayPage({ params }: PlayPageProps) {
  if (!params.slug || params.slug.length === 0) {
    return <div>Invalid image path.</div>;
  }
  const slug = params.slug.map(segment => decodeURIComponent(segment)).join('/');
  const imagePath = `/puzzles/${slug}`;

  return (
      <div className="w-full h-full">
        <DynamicPuzzleGame imageSrc={imagePath} slug={slug} />
      </div>
  );
}
