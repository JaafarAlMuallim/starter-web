import { Loader2 } from "lucide-react";
import React from "react";

const Loader = () => {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem-1px)] flex-col items-center justify-center gap-4">
      <Loader2 className="text-primary-black h-10 w-10 animate-spin" />
      <p className="text-primary-black text-2xl">Loading...</p>
    </div>
  );
};
export default Loader;
