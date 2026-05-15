"use client";
import { useState, useEffect, useDeferredValue, use } from "react";

import { Search, Calendar as CalendarIcon, X, LogOut } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useSearchParams } from "next/navigation";
import { RegistrationCard } from "./registration-card";
import { logoutAction } from "@/app/_server/action";
import { cn } from "@/lib/utils";
import { Button } from "@/app/_components/ui/button";
import { Calendar } from "@/app/_components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";

// --- Date Picker Component ---
function DatePicker({
  date,
  onChange,
}: {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  return (
    <div className="relative flex items-center w-full md:w-auto">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full md:w-[240px] h-10 justify-start text-left font-normal bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:text-white transition-all shadow-xs pr-10",
              !date && "text-white/30",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-slate-950 border-white/10 shadow-2xl backdrop-blur-xl rounded-[28px] overflow-hidden"
          align="start"
          sideOffset={8}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {date && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(undefined);
          }}
          className="absolute right-3 p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer z-10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// --- Main Filter Component ---
export function RegistrationFilter({
  registrationsPromise,
}: {
  registrationsPromise: Promise<any[]>;
}) {
  const registrations = use(registrationsPromise);
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const search = searchParams.get("query") || "";
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : undefined;

  const [searchTerm, setSearchTerm] = useState(search);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [localDate, setLocalDate] = useState<Date | undefined>(date);

  // Sync URL with local state (Instant and Non-blocking 'Soft' Update)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (searchTerm) params.set("query", searchTerm);
    else params.delete("query");

    if (localDate) params.set("date", localDate.toISOString());
    else params.delete("date");

    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    if (window.location.search !== (queryString ? `?${queryString}` : "")) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [searchTerm, localDate]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("query") || "";
      const d = params.get("date");
      setSearchTerm(q);
      setLocalDate(d ? new Date(d) : undefined);
      setCurrentPage(1);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const clearAll = () => {
    setSearchTerm("");
    setLocalDate(undefined);
    setCurrentPage(1);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  const handleDateChange = (d: Date | undefined) => {
    setLocalDate(d);
    setCurrentPage(1);
  };

  // Filtering happens on LOCAL state for instant response
  const filteredRegistrations = registrations.filter((reg) => {
    // Date filter first (fastest)
    const regDate = reg.createdAt || reg.created_at;
    const matchesDate =
      !localDate || (regDate && isSameDay(new Date(regDate), localDate));

    if (!matchesDate) return false;

    // Search filter
    const s = deferredSearchTerm.toLowerCase().trim();
    if (!s) return true;

    const searchDigits = s.replace(/\D/g, "");
    const regPhone = (reg.phoneNumber || "").toString().toLowerCase();
    const regFullPhone = ((reg.countryCode || "") + (reg.phoneNumber || ""))
      .toString()
      .replace(/\D/g, "");

    return (
      (reg.fullName || "").toLowerCase().includes(s) ||
      (reg.email || "").toLowerCase().includes(s) ||
      regPhone.includes(s) ||
      (searchDigits && regFullPhone.includes(searchDigits))
    );
  });

  const totalItems = filteredRegistrations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRegistrations = filteredRegistrations.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const hasFilters = search || date;

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center justify-between lg:justify-start gap-4">
          <div className="text-left">
            <h1 className="text-xl sm:text-3xl font-semibold text-white/90">
              Study Abroad & <br /> International Education Fair
            </h1>
            <p className="text-white/50 text-[12px] sm:text-sm mt-1">
              Track and manage attendees for the upcoming event
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="lg:hidden bg-red-200 rounded-full text-red-500 hover:text-red-400 hover:bg-red-400/10 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative group flex-1 sm:w-80 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name or phone..."
              className="w-full h-10 bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 text-sm text-white placeholder:text-white/20 focus:outline-hidden focus:border-primary/50 focus:bg-white/8 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Date Picker & Clear All */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 min-w-0 sm:w-auto sm:flex-initial">
              <DatePicker date={localDate} onChange={handleDateChange} />
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={clearAll}
                className="h-10 px-3 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20 cursor-pointer shrink-0"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
          {/* Desktop Logout */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="hidden lg:flex h-10 px-4 bg-white/5 border-white/10 text-white/60 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 cursor-pointer transition-all"
          >
            <LogOut className="h-4 w-4 mr-2 text-red-400" />
            Logout
          </Button>
        </div>
      </div>

      {/* Pagination and Status Bar */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-y border-white/5">
          <div className="text-white/40 text-[11px] sm:text-xs font-medium text-center sm:text-left">
            Showing <span className="text-white/70">{startIndex + 1}</span>-
            <span className="text-white/70">
              {Math.min(startIndex + itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="text-white/70">{totalItems}</span> registrations
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0 bg-white/5 border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-all"
              >
                {"<"}
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "h-8 w-8 p-0 text-xs transition-all",
                        currentPage === pageNum
                          ? "bg-primary hover:bg-primary/90 text-white border-transparent shadow-lg shadow-primary/20"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-white",
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="h-8 w-8 p-0 bg-white/5 border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-all"
              >
                {">"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Data List */}
      <div className="space-y-4 min-h-[400px]">
        {filteredRegistrations.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center animate-in fade-in duration-500">
            <p className="text-white/60">
              {registrations.length === 0
                ? "No registrations found."
                : "No registrations match your filters."}
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="mt-4 text-blue-700 text-shadow-xs hover:underline text-sm font-medium cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {paginatedRegistrations.map((reg: any, index: number) => (
              <div
                key={reg._id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
              >
                <RegistrationCard registration={reg} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
