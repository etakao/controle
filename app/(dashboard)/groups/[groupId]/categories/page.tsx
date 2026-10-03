import { CategoriesManager } from "@/components/categories/CategoriesManager";

export default function CategoriesPage({ params }: { params: { groupId: string } }) {
  return <CategoriesManager groupId={params.groupId} />;
}
