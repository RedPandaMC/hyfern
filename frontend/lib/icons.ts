/**
 * Centralized icon exports using Material Design icons from react-icons.
 * All components should import icons from this file.
 */
export {
  // Navigation & Layout
  MdHome as Home,
  MdTerminal as Terminal,
  MdInventory2 as Package,
  MdSettings as Settings,
  MdMemory as Cpu,
  MdBarChart as BarChart,
  MdLanguage as Globe,
  MdFolder as Folder,
  MdStorage as Database,
  MdGroup as Users,
  MdLogout as LogOut,
  MdArrowBack as ArrowLeft,

  // Status & Actions
  MdPowerSettingsNew as Power,
  MdRefresh as RotateCw,
  MdStop as Square,
  MdDangerous as Skull,
  MdCheck as Check,
  MdContentCopy as Copy,
  MdLock as Lock,
  MdShield as Shield,
  MdOpenInNew as ExternalLink,

  // Dashboard & Analytics
  MdShowChart as Activity,
  MdTrendingUp as TrendingUp,
  MdBolt as Zap,
  MdPerson as User,
  MdDarkMode as Moon,
  MdLightMode as Sun,
  MdSpeed as Gauge,

  // Server & Resources
  MdDns as Server,
  MdErrorOutline as AlertCircle,
  MdAutorenew as Loader2,

  // Mods & Files
  MdSearch as Search,
  MdFilterList as Filter,
  MdDownload as Download,
  MdUpload as Upload,
  MdUploadFile as FileUp,
  MdDelete as Trash2,
  MdEdit as Edit,
  MdWarning as AlertTriangle,
  MdKey as Key,

  // Settings
  MdSave as Save,
  MdInfo as Info,
  MdCode as Code,
  MdPersonAdd as UserPlus,

  // Visibility
  MdVisibility as Eye,
  MdVisibilityOff as EyeOff,

  // UI primitives (used by shadcn/ui components)
  MdChevronRight as ChevronRight,
  MdChevronLeft as ChevronLeft,
  MdKeyboardArrowDown as ChevronDown,
  MdKeyboardArrowUp as ChevronUp,
  MdClose as X,
  MdCircle as Circle,
} from 'react-icons/md';

// MemoryStick doesn't have a direct Material equivalent, use a memory-related icon
export { MdMemory as MemoryStick } from 'react-icons/md';

// Aliases for lucide-react names that differ from our primary exports
export { MdRefresh as RefreshCcw } from 'react-icons/md';
