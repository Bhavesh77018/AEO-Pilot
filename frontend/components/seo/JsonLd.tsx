/**
 * Renders one or more JSON-LD objects as a <script type="application/ld+json">.
 * Server-rendered, so AI crawlers (which don't run JS) see it in the HTML.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = Array.isArray(data) ? data : [data];
  return (
    <>
      {json.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Schema content is our own, not user input — safe to inline.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </>
  );
}
