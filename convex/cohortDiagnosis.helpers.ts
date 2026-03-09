import {
  computeMasteryFromComponents,
  getDefaultCourseDashboardConfig,
  getDiagnosisBucketForMasteryScore,
  type DiagnosisThresholds,
  type MasteryWeights,
} from "./scoreUtils"

type DiagnosisUserRecord<LearnerId extends string = string> = {
  _id: LearnerId
  userId?: string | null
  name: string
  role: string
  lastActiveAt?: number | null
}

type ModuleMasterySnapshot = {
  userId: string
  moduleId: string
  applicationScore: number
  comprehensionScore: number
  retentionScore: number
  behavioralScore: number
  masteryScore: number
  calculatedAt: number
}

type DiagnosisRiskBucket =
  | "high_mastery"
  | "on_track"
  | "at_risk"
  | "disengaged"

type DiagnosisLearnerRow<LearnerId extends string = string> = {
  learnerId: LearnerId
  externalUserId: string
  learnerName: string
  applicationScore: number
  retrievalScore: number
  retentionScore: number
  behaviourScore: number
  masteryScore: number
  riskBucket: DiagnosisRiskBucket
  snapshotCount: number
  latestCalculatedAt: number
}

export function buildCourseLearnerRows<LearnerId extends string>({
  moduleIds,
  snapshots,
  users,
  masteryWeights = getDefaultCourseDashboardConfig().masteryWeights,
  diagnosisThresholds = getDefaultCourseDashboardConfig().diagnosisThresholds,
  nowSec = Date.now() / 1000,
}: {
  moduleIds: string[]
  snapshots: ModuleMasterySnapshot[]
  users: DiagnosisUserRecord<LearnerId>[]
  masteryWeights?: MasteryWeights
  diagnosisThresholds?: DiagnosisThresholds
  nowSec?: number
}): DiagnosisLearnerRow<LearnerId>[] {
  const relevantModuleIds = new Set(moduleIds)
  const latestSnapshots = new Map<string, ModuleMasterySnapshot>()

  for (const snapshot of snapshots) {
    if (!relevantModuleIds.has(snapshot.moduleId)) continue

    const key = `${snapshot.userId}:${snapshot.moduleId}`
    const current = latestSnapshots.get(key)
    if (!current || snapshot.calculatedAt > current.calculatedAt) {
      latestSnapshots.set(key, snapshot)
    }
  }

  const snapshotsByUser = new Map<string, ModuleMasterySnapshot[]>()
  for (const snapshot of latestSnapshots.values()) {
    const userSnapshots = snapshotsByUser.get(snapshot.userId) ?? []
    userSnapshots.push(snapshot)
    snapshotsByUser.set(snapshot.userId, userSnapshots)
  }

  const rows = users
    .filter((user) => user.role === "learner" && Boolean(user.userId))
    .flatMap((user) => {
      const externalUserId = user.userId
      if (!externalUserId) return []

      const userSnapshots = snapshotsByUser.get(externalUserId) ?? []

      const averageOf = (
        getter: (snapshot: ModuleMasterySnapshot) => number
      ) =>
        userSnapshots.length === 0
          ? 0
          : userSnapshots.reduce((sum, snapshot) => sum + getter(snapshot), 0) / userSnapshots.length

      const applicationScore = averageOf((snapshot) => snapshot.applicationScore)
      const retrievalScore = averageOf((snapshot) => snapshot.comprehensionScore)
      const retentionScore = averageOf((snapshot) => snapshot.retentionScore)
      const behaviourScore = averageOf((snapshot) => snapshot.behavioralScore)
      const masteryScore = computeMasteryFromComponents({
        applicationScore,
        retrievalScore,
        retentionScore,
        behaviourScore,
        masteryWeights,
      })
      const lastActiveAt = user.lastActiveAt ?? nowSec
      const daysSinceActive = (nowSec - lastActiveAt) / 86400
      const riskBucket = getDiagnosisBucketForMasteryScore({
        masteryScore,
        daysSinceActive,
        hasActivityData: userSnapshots.length > 0,
        diagnosisThresholds,
      }) as DiagnosisRiskBucket

      return [
        {
          learnerId: user._id,
          externalUserId,
          learnerName: user.name,
          applicationScore: Math.round(applicationScore * 100) / 100,
          retrievalScore: Math.round(retrievalScore * 100) / 100,
          retentionScore: Math.round(retentionScore * 100) / 100,
          behaviourScore: Math.round(behaviourScore * 100) / 100,
          masteryScore: Math.round(masteryScore),
          riskBucket,
          snapshotCount: userSnapshots.length,
          latestCalculatedAt: userSnapshots.length
            ? Math.max(...userSnapshots.map((snapshot) => snapshot.calculatedAt))
            : 0,
        },
      ]
    })

  return [...rows].sort((left, right) => {
    if (left.masteryScore !== right.masteryScore) {
      return left.masteryScore - right.masteryScore
    }
    return left.learnerName.localeCompare(right.learnerName)
  })
}

export function buildDiagnosisLearnerRows<LearnerId extends string>({
  moduleIds,
  selectedRiskBucket,
  snapshots,
  users,
  masteryWeights = getDefaultCourseDashboardConfig().masteryWeights,
  diagnosisThresholds = getDefaultCourseDashboardConfig().diagnosisThresholds,
  nowSec = Date.now() / 1000,
}: {
  moduleIds: string[]
  selectedRiskBucket: DiagnosisRiskBucket
  snapshots: ModuleMasterySnapshot[]
  users: DiagnosisUserRecord<LearnerId>[]
  masteryWeights?: MasteryWeights
  diagnosisThresholds?: DiagnosisThresholds
  nowSec?: number
}) {
  return buildCourseLearnerRows({
    moduleIds,
    snapshots,
    users,
    masteryWeights,
    diagnosisThresholds,
    nowSec,
  }).filter((row) => row.riskBucket === selectedRiskBucket)
}
