const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/5 bg-[#0B1120] mt-32">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        <p className="text-slate-500 text-sm">
          &copy; {currentYear} Tóth Henrik. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
