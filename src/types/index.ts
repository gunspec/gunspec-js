// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Type barrel exports
// ---------------------------------------------------------------------------
// Re-exports every public type from the SDK type system.
// ---------------------------------------------------------------------------

// ── Domain models ──────────────────────────────────────────────────────────

export type {
  // Core resources
  Firearm,
  FirearmListItem,
  FirearmDetail,
  FirearmCaliberEntry,
  FirearmVariant,
  Manufacturer,
  ManufacturerStats,
  ManufacturerTimeline,
  Caliber,
  CaliberBallistics,
  CaliberFamily,
  Category,
  Ammunition,

  // Firearm sub-resources
  FirearmImage,
  FirearmUser,

  // Ballistics
  TrajectoryPoint,
  TerminalBallistics,
  BallisticProfile,
  FirearmCalculation,
  FirearmLoadProfile,

  // Game system
  GameStats,
  GameProfile,
  GameMetaItem,
  BalanceEntry,
  BalanceDeviation,
  TierList,
  TierItem,
  MatchupResult,
  RoleRosterItem,
  StatDistribution,
  GameStatsVersion,
  GameStatsSnapshotEntry,

  // Comparisons
  FirearmComparison,
  FirearmComparisonDelta,
  CaliberComparison,
  HeadToHead,
  FamilyTree,
  SimilarFirearm,
  AdoptionMap,

  // Rankings & lists
  TopFirearmItem,
  PowerRating,
  TimelineItem,
  Dimensions,
  FilterOptions,

  // Statistics
  StatsSummary,
  ProductionStatusItem,
  FieldCoverage,
  PopularCaliber,
  ProlificManufacturer,
  CategoryStats,
  EraStats,
  MaterialStats,
  AdoptionByCountryItem,
  AdoptionByTypeItem,
  ActionTypeStats,
  FeatureFrequency,
  CaliberPopularityByEra,

  // Geography & conflicts
  Country,
  Conflict,

  // Data quality
  DataCoverage,
  TableCoverage,
  ConfidenceEntry,

  // Additional resource types
  CountryArsenal,
  CountryArsenalEntry,
  BallisticsResult,
  Silhouette,
  BalanceReport,
  RoleRoster,

  // Response wrappers
  PaginatedResponse,
  SuccessResponse,

  // User-scoped resources
  Favorite,
  FavoriteToggle,
  DataReport,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketReply,
  WebhookEndpoint,
  WebhookTestResult,
  UsageStats,

  // Content + public collections
  ChangelogEntry,
  BlogPost,
  PublicCollection,

  // Catalog + firearm extras
  CatalogCoverage,
  FirearmSchematic,
  PopularFirearm,
  WebhookEndpointCreated,

  // Provenance and caliber geometry vocabularies
  Provenance,
  CaseShape,
  CaseMaterial,
  ProjectileKind,
  BulletProfile,
  Closure,
  MarkingColor,
  SpecStandard,
} from './models';

// ── Request parameter types ────────────────────────────────────────────────

export type {
  // Common
  PaginationParams,
  SlugParam,
  CategorySlugParam,
  VersionParam,
  VersionFirearmParam,

  // Firearms
  ListFirearmsParams,
  SilhouetteParams,
  SearchFirearmsParams,
  CompareFirearmsParams,
  GameMetaParams,
  RandomFirearmParams,
  TopFirearmsParams,
  HeadToHeadParams,
  ByFeatureParams,
  ByActionParams,
  ByMaterialParams,
  ByDesignerParams,
  PowerRatingParams,
  TimelineParams,
  ByConflictParams,
  CalculateBallisticsParams,
  LoadFirearmParams,

  // Manufacturers
  ListManufacturersParams,

  // Calibers
  ListCalibersParams,
  CompareCalibersParams,
  CaliberBallisticsParams,

  // Ammunition
  ListAmmunitionParams,
  AmmunitionBallisticsParams,

  // Stats
  PopularCalibersParams,
  ProlificManufacturersParams,
  ByEraParams,
  AdoptionByCountryParams,
  AdoptionByTypeParams,
  ActionTypesParams,
  FeatureFrequencyParams,
  CaliberPopularityByEraParams,

  // Game
  BalanceReportParams,
  TierListParams,
  MatchupsParams,
  RoleRosterParams,
  StatDistributionParams,

  // Game Stats Snapshots
  ListSnapshotFirearmsParams,

  // Countries & Conflicts
  CountryCodeParam,
  ConflictNameQuery,

  // Data Quality
  ConfidenceParams,

  // User-scoped (via /v1/me)
  ListFavoritesParams,
  CreateReportParams,
  ListReportsParams,
  CreateTicketParams,
  ListTicketsParams,
  CreateReplyParams,
  CreateWebhookEndpointParams,
  UpdateWebhookEndpointParams,
  ListWebhookEndpointsParams,
  UsageParams,
} from './api';

// ── Error types ────────────────────────────────────────────────────────────

export type {
  ErrorBody,
  APIErrorResponse,
  APIErrorCode,
} from './errors';

// ── Attachment compatibility ──────────────────────────────────────────────

export type {
  InterfaceStandard,
  FirearmInterface,
  PlatformSummary,
  Platform,
  PlatformDetail,
  FirearmInterfaces,
  Attachment,
  AttachmentDetail,
  FitVia,
  AttachmentFit,
  FirearmAttachments,
  AttachmentFirearmFit,
  InterfaceFirearm,
  ListAttachmentsParams,
  FirearmAttachmentsParams,
  ListInterfacesParams,
  PublicOffer,
  OffersParams,
} from './compat';

// ── Seller ────────────────────────────────────────────────────────────────

export type {
  VendorShop,
  VendorOffer,
  ListVendorOffersParams,
  OfferInput,
  PushOffersInput,
  PushOffersResult,
  UpdateOfferInput,
  VendorScope,
} from './seller';

// ── Media, resolution, notices ────────────────────────────────────────────

export type {
  InlineMediaItem,
  FirearmMedia,
  MediaCatalogItem,
  MediaCatalogParams,
  ListFirearmMediaParams,
  GetFirearmMediaParams,
  ImageAsset,
  ImageAssetParams,
  ResolveAlternative,
  ResolveResult,
  ResolveManyResult,
  SiteNotice,
} from './media';

// ── Documentation as data ─────────────────────────────────────────────────

export type {
  DocsSampleLanguage,
  DocsHttpMethod,
  GetDocsOperationsParams,
  GetDocsSampleParams,
  DocsParameter,
  DocsError,
  DocsOperation,
  DocsOperations,
  DocsSample,
  DocsSamples,
  DocsPlanLimits,
  DocsLimits,
  DocsGuideHeading,
  DocsGuideSection,
  DocsGuideSummary,
  DocsGuides,
  GetDocsGuideParams,
  DocsGuide,
  SearchDocsGuidesParams,
  DocsGuideSearchHit,
  DocsGuideSearch,
} from './docs';

// ── Generated contracts ───────────────────────────────────────────────────

export {
  FIREARM_STATUSES,
  FIREARM_ACTION_TYPES,
  ATTACHMENT_STATUSES,
  MEDIA_KINDS,
  IMAGE_TYPES,
  SCHEMATIC_TYPES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  REPORT_ISSUE_TYPES,
  REPORT_STATUSES,
  INTERFACE_SOURCES,
  FIT_TYPES,
  FIT_SOURCES,
  SOURCE_KINDS,
  GAME_ARCHETYPES,
  CHANGELOG_CATEGORIES,
  NOTICE_VARIANTS,
  OFFER_STATUSES,
  OFFER_TARGET_KINDS,
  ADOPTION_TYPES,
} from './vocabulary';
export type {
  FirearmStatus,
  FirearmActionType,
  AttachmentStatus,
  MediaKind,
  ImageType,
  SchematicType,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  ReportIssueType,
  ReportStatus,
  InterfaceSource,
  FitType,
  FitSource,
  SourceKind,
  GameArchetype,
  ChangelogCategory,
  NoticeVariant,
  OfferStatus,
  OfferTargetKind,
  AdoptionType,
} from './vocabulary';
export type { components, Schema } from './generated';

export { ERROR_REASONS, ERROR_REASON_NAMES, isErrorReason } from './error-reasons';
export type { ErrorReason } from './error-reasons';
export { WEBHOOK_EVENT_TYPES, isWebhookEventType } from './webhook-events';
export type { WebhookEventType } from './webhook-events';
