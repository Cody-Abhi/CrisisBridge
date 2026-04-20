import RoomBlock from './RoomBlock'
import { useTheme } from '../../contexts/ThemeContext'

export default function RoomGrid({ floorLayout = {}, activeSOS = [] }) {
  const { darkMode } = useTheme()
  // Build a map of roomNumber -> sosData for fast lookup
  const sosMap = {}
  activeSOS.forEach(sos => {
    sosMap[sos.roomNumber] = sos
  })

  // Floors might be string numbers like "1", "2"
  const floors = Object.keys(floorLayout).sort((a, b) => Number(a) - Number(b))

  if (floors.length === 0) {
    return (
      <div className={`italic p-10 border-2 border-dashed rounded-3xl text-center transition-colors ${
        darkMode ? 'text-slate-600 border-slate-800' : 'text-slate-400 border-slate-200'
      }`}>
        <span className="material-symbols-outlined text-4xl mb-2 opacity-20">map</span>
        <p className="text-sm font-medium tracking-tight">No floor layout configured for this hotel.</p>
      </div>
    )
  }

  return (
    <div className={`p-6 rounded-3xl transition-all duration-300 border mx-auto max-w-4xl ${
      darkMode ? 'bg-surface-container border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-8">
        <h3 className={`text-xl font-black transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>Floor Map</h3>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'
        }`}>
          {floors.length} Floors
        </div>
      </div>
      <div className="space-y-8">
        {floors.map(floor => (
          <div key={floor} className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Floor label */}
            <div className={`text-[10px] font-black uppercase tracking-widest sm:w-20 text-center sm:text-left shrink-0 pt-0 sm:pt-3 transition-colors ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Floor {floor}
            </div>
            {/* Room blocks */}
            <div className="flex flex-wrap gap-2 flex-1 justify-center sm:justify-start">
              {floorLayout[floor].slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(roomNum => (
                <RoomBlock
                  key={roomNum}
                  roomNumber={roomNum}
                  sosData={sosMap[roomNum] || null}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

  )
}
