import HomeClient from "@/components/HomeClient";
import { getTemplates } from "@/app/actions/template.actions";

import { Suspense } from "react";
import Loading from "./loading";

export default async function Home() {
    const templates = await getTemplates();
    return (
        <Suspense fallback={<Loading />}>
            <HomeClient initialTemplates={templates} />
        </Suspense>
    );
}
