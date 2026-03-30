import HomeClient from "@/components/HomeClient";
import { getTemplates } from "@/app/actions/template.actions";

export default async function Home() {
    const templates = await getTemplates();
    return <HomeClient initialTemplates={templates} />;
}
