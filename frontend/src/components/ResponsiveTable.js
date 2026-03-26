// Mobile-responsive table wrapper component
export function ResponsiveTable({ children, mobileCards }) {
  return (
    <>
      {/* Desktop table view */}
      <div className="hidden md:block bg-white border shadow-sm rounded-sm overflow-hidden">
        {children}
      </div>
      
      {/* Mobile card view */}
      {mobileCards && (
        <div className="md:hidden space-y-3">
          {mobileCards}
        </div>
      )}
    </>
  );
}
