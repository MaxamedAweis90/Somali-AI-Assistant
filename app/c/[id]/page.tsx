import { redirect } from "next/navigation";

interface LegacyConversationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LegacyConversationPage({ params }: LegacyConversationPageProps) {
  const { id } = await params;

  redirect(`/chat/c/${id}`);
}