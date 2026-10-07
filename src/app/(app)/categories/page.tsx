import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import BucketBadge from "@/components/BucketBadge";
import DeleteButton from "@/components/DeleteButton";
import CategoryForm from "@/components/forms/CategoryForm";
import { deleteCategory } from "@/actions/categories";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await prisma.category.findMany({ where: { userId: user.id }, orderBy: [{ kind: "asc" }, { name: "asc" }] });

  return (
    <div className="p-5 md:p-8 max-w-[1100px] mx-auto">
      <PageHeader title="Categories" subtitle="Expense & income categories and their default buckets" actions={<CategoryForm />} />
      <div className="card overflow-hidden"><div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Kind</th><th>Default Bucket</th><th></th></tr></thead>
          <tbody>
            {categories.length === 0 && <tr><td colSpan={4} className="text-center muted py-10">No categories yet.</td></tr>}
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td><span className="badge capitalize">{c.kind}</span></td>
                <td>{c.defaultBucket === "Income" ? <span className="badge">Income</span> : <BucketBadge bucket={c.defaultBucket} />}</td>
                <td><div className="flex items-center gap-1 justify-end"><CategoryForm initial={{ id: c.id, name: c.name, defaultBucket: c.defaultBucket, kind: c.kind }} /><DeleteButton action={deleteCategory} id={c.id} message="Delete this category? Entries using it will be set to “no category”." /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
