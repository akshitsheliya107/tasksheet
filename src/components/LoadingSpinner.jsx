import { Clock } from "lucide-react";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1A1A1A] transition-colors duration-200">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 dark:border-[#333333] rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 dark:border-emerald-400 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Clock size={24} className="text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">{message}</p>
    </div>
  );
}
