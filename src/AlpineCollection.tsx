const COLLECTION = [
  { category: 'GOGGLES', items: [
    ['006', 'Fall Line Pro · Prizm Rose Lens'],
    ['004', 'Fall Line · Standard Lens · 4 Colors'],
    ['003', 'Flight Tracker · Steep Terrain · 3×'],
    ['002', 'Line Miner · Wide Peripheral · 2×'],
    ['016', 'Replacement Lenses · 16 Tints'],
  ] },
  { category: 'HELMETS', items: [
    ['003', 'Mod3 · MIPS · Adjustable Venting'],
    ['002', 'Mod1 · Entry Level · 2 Models'],
    ['001', 'Dispatch · Backcountry Specific'],
  ] },
  { category: 'JACKETS', items: [
    ['004', 'Gore-Tex Pro Shell · 3L Waterproof'],
    ['003', 'Gore-Tex Shell · 2L Insulated · 3×'],
    ['002', 'Softshell · Breathable · 2 Colors'],
    ['001', 'Anorak · Pullover Style'],
  ] },
];

export function AlpineCollection({ staticLayout }: { staticLayout: boolean }) {
  return <section id="collection" aria-labelledby="collection-title" className={`alpine-collection ${staticLayout ? 'motion-static' : ''}`}>
    <div className="collection-background" aria-hidden="true">
      <div className="collection-background-type">
        <span>GEAR UP.</span>
        <span>RIDE HARD.</span>
        <span>BUILT FOR WINTER.</span>
        <span>MADE FOR MOUNTAINS.</span>
      </div>
    </div>
    <header className="collection-header">
      <h2 id="collection-title" className="alpine-display">ALPINE<sup>°</sup></h2>
    </header>
    <table className="collection-table" aria-label="Alpine winter equipment collection">
      <caption className="sr-only">Equipment categories, counts and models</caption>
      <colgroup><col className="collection-category-column" /><col className="collection-count-column" /><col className="collection-model-column" /></colgroup>
      <thead className="sr-only"><tr><th scope="col">Category</th><th scope="col">Count</th><th scope="col">Model</th></tr></thead>
      {COLLECTION.map(group => <tbody className="collection-group" key={group.category}>
        {group.items.map(([count, description], index) => <tr className="collection-row" key={description}>
          {index === 0 && <th scope="rowgroup" rowSpan={group.items.length} className="collection-category"><span>{group.category}</span></th>}
          <td className="collection-count"><span>{count}</span></td>
          <td className="collection-model"><span>{description}</span></td>
        </tr>)}
      </tbody>)}
    </table>
  </section>;
}
