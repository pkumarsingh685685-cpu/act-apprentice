import { useStore } from "../store/useStore";
import { NewBadge } from "../components/NewBadge";

export default function NoticeBoardPage() {
  const notices = useStore((state) => state.notices);
  const meritPanels = useStore((state) => state.meritPanels);
  const results = useStore((state) => state.results);
  const darCirculars = useStore((state) => state.darCirculars);
  const actCirculars = useStore((state) => state.actCirculars);

  // Combine all items
  const allItems = [
    ...notices.map((n) => ({ ...n, type: "Notice" })),
    ...meritPanels.map((n) => ({ ...n, type: "Merit List" })),
    ...results.map((n) => ({ ...n, type: "Result" })),
    ...darCirculars.map((n) => ({ ...n, type: "DAR Circular" })),
    ...actCirculars.map((n) => ({ ...n, type: "Act Circular" })),
  ];

  // Sort logically (by date descending)
  const sortedItems = allItems.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="flex-1 w-full bg-white px-2 py-4 sm:px-4 sm:py-8 max-w-7xl mx-auto">
      <div className="border border-[#b5c5d5] rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-[#e9f0f8] text-[#000080] border-b border-[#b5c5d5]">
              <th className="p-3 font-bold border-r border-[#b5c5d5] w-16 text-center">
                SN
              </th>
              <th className="p-3 font-bold border-r border-[#b5c5d5] w-32 text-center whitespace-nowrap">
                Date
              </th>
              <th className="p-3 font-bold">Descriptive</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0] bg-white">
            {sortedItems.map((item, index) => (
              <tr
                key={`${item.type}-${item.id}`}
                className="hover:bg-[#f8f9fa] transition-colors duration-150"
              >
                <td className="p-3 border-r border-[#b5c5d5] text-center text-gray-700">
                  {index + 1}
                </td>
                <td className="p-3 border-r border-[#b5c5d5] text-center text-gray-700 whitespace-nowrap">
                  {item.date}
                </td>
                <td className="p-3">
                  <div className="flex items-start">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0000ee] hover:underline flex-1 text-[15px]"
                    >
                      <span className="font-semibold text-gray-500 mr-1">
                        [{item.type}]
                      </span>{" "}
                      {item.title}
                    </a>
                    {item.isNew && <NewBadge />}
                  </div>
                </td>
              </tr>
            ))}
            {sortedItems.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No notices available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
