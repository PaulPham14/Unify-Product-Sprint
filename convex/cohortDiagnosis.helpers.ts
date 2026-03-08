import { getRiskBucketForMasteryScore } from "./scoreUtils"

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
  masteryScore: number
  riskBucket: DiagnosisRiskBucket
  snapshotCount: number
  latestCalculatedAt: number
}

export function buildDiagnosisLearnerRows<LearnerId extends string>({
  moduleIds,
  selectedRiskBucket,
  snapshots,
  users,
  nowSec = Date.now() / 1000,
}: {
  moduleIds: string[]
  selectedRiskBucket: DiagnosisRiskBucket
  snapshots: ModuleMasterySnapshot[]
  users: DiagnosisUserRecord<LearnerId>[]
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

      const userSnapshots = snapshotsByUser.get(externalUserId)
      if (!userSnapshots?.length) return []

      const totalMastery = userSnapshots.reduce(
        (sum, snapshot) => sum + snapshot.masteryScore,
        0
      )
      const averageMastery = totalMastery / userSnapshots.length
      const lastActiveAt = user.lastActiveAt ?? nowSec
      const daysSinceActive = (nowSec - lastActiveAt) / 86400
      const riskBucket = getRiskBucketForMasteryScore({
        masteryScore: averageMastery,
        daysSinceActive,
        hasActivityData: userSnapshots.length > 0,
      }) as DiagnosisRiskBucket

      if (riskBucket !== selectedRiskBucket) return []

      return [
        {
          learnerId: user._id,
          externalUserId,
          learnerName: user.name,
          masteryScore: Math.round(averageMastery),
          riskBucket,
          snapshotCount: userSnapshots.length,
          latestCalculatedAt: Math.max(
            ...userSnapshots.map((snapshot) => snapshot.calculatedAt)
          ),
        },
      ]
    })

  return rows.toSorted((left, right) => {
    if (left.masteryScore !== right.masteryScore) {
      return left.masteryScore - right.masteryScore
    }
    return left.learnerName.localeCompare(right.learnerName)
  })
}
