export interface RepeatStep {
  order: number
  action: "listen" | "repeat"
  label: string
}

export const buildRepeatToHearFlow = (cycles = 2): RepeatStep[] => {
  const steps: RepeatStep[] = []
  for (let i = 0; i < cycles; i += 1) {
    const startOrder = i * 2
    steps.push({
      order: startOrder + 1,
      action: "listen",
      label: `Cycle ${i + 1}: Listen carefully`,
    })
    steps.push({
      order: startOrder + 2,
      action: "repeat",
      label: `Cycle ${i + 1}: Repeat from memory`,
    })
  }
  return steps
}
