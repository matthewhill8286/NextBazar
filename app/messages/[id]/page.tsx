import ChatThread from "./chat-thread";

export default async function ChatPage(
  props: PageProps<"/messages/[id]">,
) {
  const { id } = await props.params;
  return <ChatThread conversationId={id} />;
}
