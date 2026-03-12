import { redirect } from 'next/navigation';

export default async function ShortLinkRedirect({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    redirect(`/anamnese/${slug}`);
}
