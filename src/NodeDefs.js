module.exports = {
  
  INPUT: {
    name: 'Input',
    plugName: 'in',
    key: 'inputs'
  },
  OUTPUT: {
    name: 'Output',
    plugName: 'out',
    key: 'outputs'
  },

  // Boolean levels
  LOW: 0,
  HIGH: 1,

  // Triggers
  PULSE: 'pulse',
  RISE: 'rise',
  FALL: 'fall',
  CHANGE: 'change',
  
  // Processor patterns (see https://github.com/sindresorhus/matcher)
  PUSHED: '>*',
  CATCH: '*', 
};
