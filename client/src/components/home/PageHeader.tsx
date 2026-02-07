import type { Category } from "../../types";

interface PageHeaderProps {
  selectedCategoryId: number | null;
  categories: Category[];
}

const PageHeader = ({ selectedCategoryId, categories }: PageHeaderProps) => {
  return (
    <div className="mb-12">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
        {selectedCategoryId
          ? categories.find((c) => c.id === selectedCategoryId)?.name
          : "Latest Insights"}
      </h1>
      <p className="text-slate-400 text-lg">
        {selectedCategoryId
          ? "Browsing category"
          : "Exploring the future of technology."}
      </p>
    </div>
  );
};

export default PageHeader;
