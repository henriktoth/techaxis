import type { Category } from "../types";

interface NavbarProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
}

const Navbar = ({ categories, selectedCategoryId, onSelectCategory }: NavbarProps) => {
  
  const getButtonClass = (isActive: boolean) =>
    `px-5 py-2 rounded-full text-sm font-medium transition-colors ${
      isActive
        ? "bg-black text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <nav className="flex flex-wrap justify-center gap-3">
      <button
        onClick={() => onSelectCategory(null)}
        className={getButtonClass(selectedCategoryId === null)}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={getButtonClass(selectedCategoryId === cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;