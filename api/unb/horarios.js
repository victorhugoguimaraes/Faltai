const dayMap = {
  '2': 'Segunda-feira',
  '3': 'Terça-feira',
  '4': 'Quarta-feira',
  '5': 'Quinta-feira',
  '6': 'Sexta-feira',
  '7': 'Sábado'
};

const shiftMap = {
  M: {
    label: 'Manhã',
    slots: {
      '1': { start: '08:00', end: '08:55' },
      '2': { start: '08:55', end: '09:50' },
      '3': { start: '10:00', end: '10:55' },
      '4': { start: '10:55', end: '11:50' },
      '5': { start: '12:00', end: '12:55' }
    }
  },
  T: {
    label: 'Tarde',
    slots: {
      '1': { start: '12:55', end: '13:50' },
      '2': { start: '14:00', end: '14:55' },
      '3': { start: '14:55', end: '15:50' },
      '4': { start: '16:00', end: '16:55' },
      '5': { start: '16:55', end: '17:50' },
      '6': { start: '18:00', end: '18:55' },
      '7': { start: '18:55', end: '19:50' }
    }
  },
  N: {
    label: 'Noite',
    slots: {
      '1': { start: '19:00', end: '19:50' },
      '2': { start: '19:50', end: '20:40' },
      '3': { start: '20:50', end: '21:40' },
      '4': { start: '21:40', end: '22:30' }
    }
  }
};

function splitScheduleBlocks(scheduleCode = '') {
  return scheduleCode.match(/\d+[MTN]\d+/g) || [];
}

function parseScheduleBlock(block) {
  const match = block.match(/^([2-7]+)([MTN])(\d+)$/);

  if (!match) {
    return null;
  }

  const [, rawDays, shift, rawSlots] = match;
  const shiftInfo = shiftMap[shift];

  if (!shiftInfo) {
    return null;
  }

  const slotNumbers = rawSlots.split('');
  const firstSlot = shiftInfo.slots[slotNumbers[0]];
  const lastSlot = shiftInfo.slots[slotNumbers[slotNumbers.length - 1]];

  if (!firstSlot || !lastSlot) {
    return null;
  }

  return {
    block,
    shift,
    shiftLabel: shiftInfo.label,
    days: rawDays.split('').map((day) => ({
      value: day,
      label: dayMap[day]
    })),
    slotNumbers,
    startTime: firstSlot.start,
    endTime: lastSlot.end
  };
}

function decodeSigaaSchedule(scheduleCode = '') {
  const parsedBlocks = splitScheduleBlocks(scheduleCode)
    .map(parseScheduleBlock)
    .filter(Boolean);

  const meetings = parsedBlocks.flatMap((block) =>
    block.days.map((day) => ({
      dayValue: day.value,
      dayLabel: day.label,
      shift: block.shift,
      shiftLabel: block.shiftLabel,
      slots: block.slotNumbers,
      startTime: block.startTime,
      endTime: block.endTime,
      block: block.block,
      label: `${day.label} ${block.startTime} às ${block.endTime}`
    }))
  );

  return {
    code: scheduleCode,
    blocks: parsedBlocks,
    meetings,
    translated: meetings.map((meeting) => meeting.label),
    absenceWeight: parsedBlocks[0]?.slotNumbers.length || 1
  };
}

module.exports = {
  decodeSigaaSchedule,
  splitScheduleBlocks
};
