export function SkeletonGrid() {
  return (
    <div className="listing-grid" aria-label="Loading search results" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="skeleton-card" key={i} aria-hidden="true">
          <span className="skeleton-image"/>
          <div className="skeleton-body">
            <p className="skeleton-line"/>
            <p className="skeleton-line skeleton-line--short"/>
          </div>
        </div>
      ))}
    </div>
  );
}
