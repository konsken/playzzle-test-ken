
import DynamicPuzzleGame from '@/components/dynamic-puzzle-game';
import { getUnlockedPuzzles, getUserProStatus } from '@/app/account/actions';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSiteSettings } from '@/app/super-admin/settings/actions'; // Import the new function

type PlayPageProps = {
  params: {
    slug: string[];
  };
};

export async function generateMetadata({ params }: PlayPageProps): Promise<Metadata> {
  if (!params.slug || params.slug.length < 2) {
    return {
      title: 'Invalid Puzzle',
    };
  }

  const category = decodeURIComponent(params.slug[0]);
  const imageFilename = decodeURIComponent(params.slug[1]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const imageUrl = `${siteUrl}/puzzles/${category}/${imageFilename}`;

  const title = "I'm playing Playzzle!";
  const description = "Check out this fun puzzle I'm solving on Playzzle. Can you beat my time?";

  return {
    metadataBase: new URL(siteUrl),
    title: 'Play Playzzle!',
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: 'A Playzzle puzzle image',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PlayPage({ params }: PlayPageProps) {
  if (!params.slug || params.slug.length < 2) {
    return <div>Invalid image path.</div>;
  }

  const category = decodeURIComponent(params.slug[0]);
  const imageFilename = decodeURIComponent(params.slug[1]);
  const imagePath = `/puzzles/${category}/${imageFilename}`;
  const slug = `${category}/${imageFilename}`;
  
  const isProPuzzle = imageFilename.toLowerCase().includes('_pro');
  
  // Fetch all data concurrently
  const [user, { mobilePlayEnabled }] = await Promise.all([
    getAuthenticatedUser(),
    getSiteSettings()
  ]);

  // If it's a pro puzzle, we must perform security checks.
  if (isProPuzzle) {
    if (!user) {
      redirect('/login?from=/membership');
    }

    const isSuperAdmin = !!user.customClaims?.superadmin;
    // Don't waste reads if user is already an admin
    if (!isSuperAdmin) {
       // Fetch pro-related data only when necessary
      const [{ isPro }, unlockedPuzzles] = await Promise.all([
          getUserProStatus(user.uid),
          getUnlockedPuzzles(user.uid)
      ]);
      const isUnlocked = isPro || unlockedPuzzles.includes(imageFilename);

      if (!isUnlocked) {
        redirect('/membership');
      }
    }
  }

  return (
    <div className="w-full h-full">
      <DynamicPuzzleGame
        imageSrc={imagePath}
        slug={slug}
        imageFilename={imageFilename}
        mobilePlayEnabled={mobilePlayEnabled}
      />
    </div>
  );
}
