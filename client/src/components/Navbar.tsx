import type { Category } from "../types";

interface CategoryNavProps {
  categories: Category[];
}

const CategoryNav = ({ categories }: CategoryNavProps) => {
  return (
    <nav className="flex flex-wrap justify-center gap-3">

      <button className="px-5 py-2 rounded-full text-sm font-semibold bg-black text-white">
        All
      </button>


      {categories.map((cat) => (
        <button
          key={cat.id}
          className="px-5 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
};

export default CategoryNav;