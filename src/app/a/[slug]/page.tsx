import { redirect } from 'next/navigation';

export default async function ShortLinkRedirect({ params }: { params: { slug: string } }) {
    // Intercepta e repassa para a página completa usando permanent HTTP 308/307 redirect
    redirect(`/anamnese/${params.slug}`);
}
