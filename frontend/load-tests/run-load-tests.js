/**
 * Load Testing Configuration
 * Uses autocannon for HTTP load testing
 */

const autocannon = require('autocannon')

const API_URL = process.env.API_URL || 'http://localhost:3000'
const TEST_TENANT = 'load-test-tenant'

// Test configurations
const tests = {
  // Health check - baseline
  health: {
    url: `${API_URL}/api/health`,
    method: 'GET',
    duration: 10,
    connections: 10,
    pipelining: 1,
    title: 'Health Check Endpoint'
  },

  // Cart operations - POS/SVM workload
  cartRead: {
    url: `${API_URL}/api/svm/cart?tenantId=${TEST_TENANT}&sessionId=load-test-session`,
    method: 'GET',
    duration: 15,
    connections: 50,
    pipelining: 1,
    title: 'Cart Read Operations'
  },

  // Wallet read operations
  walletList: {
    url: `${API_URL}/api/wallets?tenantId=${TEST_TENANT}&limit=10`,
    method: 'GET',
    duration: 15,
    connections: 50,
    pipelining: 1,
    title: 'Wallet List Operations'
  },

  // Order listing
  orderList: {
    url: `${API_URL}/api/svm/orders?tenantId=${TEST_TENANT}&limit=10`,
    method: 'GET',
    duration: 15,
    connections: 50,
    pipelining: 1,
    title: 'Order List Operations'
  },

  // High concurrency test
  highConcurrency: {
    url: `${API_URL}/api/health`,
    method: 'GET',
    duration: 20,
    connections: 200,
    pipelining: 10,
    title: 'High Concurrency Stress Test'
  }
}

// Run a single test
async function runTest(testName, config) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Running: ${config.title}`)
  console.log(`URL: ${config.url}`)
  console.log(`Duration: ${config.duration}s, Connections: ${config.connections}`)
  console.log('='.repeat(60))

  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: config.url,
      method: config.method,
      duration: config.duration,
      connections: config.connections,
      pipelining: config.pipelining || 1,
      headers: {
        'Content-Type': 'application/json'
      }
    }, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(result)
    })

    autocannon.track(instance, { renderProgressBar: true })
  })
}

// Analyze results
function analyzeResult(testName, result) {
  const analysis = {
    test: testName,
    requests: {
      total: result.requests.total,
      average: result.requests.average,
      mean: result.requests.mean,
      stddev: result.requests.stddev,
      min: result.requests.min,
      max: result.requests.max
    },
    latency: {
      average: result.latency.average,
      mean: result.latency.mean,
      stddev: result.latency.stddev,
      min: result.latency.min,
      max: result.latency.max,
      p50: result.latency.p50,
      p90: result.latency.p90,
      p99: result.latency.p99
    },
    throughput: {
      average: result.throughput.average,
      mean: result.throughput.mean,
      total: result.throughput.total
    },
    errors: result.errors,
    timeouts: result.timeouts,
    duration: result.duration,
    connections: result.connections
  }

  // Performance assessment
  const assessment = []
  
  if (result.latency.p99 < 100) {
    assessment.push('✅ Excellent p99 latency (<100ms)')
  } else if (result.latency.p99 < 500) {
    assessment.push('⚠️ Acceptable p99 latency (<500ms)')
  } else {
    assessment.push('❌ High p99 latency (>500ms) - needs optimization')
  }

  if (result.errors === 0) {
    assessment.push('✅ No errors')
  } else {
    assessment.push(`❌ ${result.errors} errors detected`)
  }

  if (result.timeouts === 0) {
    assessment.push('✅ No timeouts')
  } else {
    assessment.push(`❌ ${result.timeouts} timeouts detected`)
  }

  const reqPerSec = result.requests.average
  if (reqPerSec > 1000) {
    assessment.push(`✅ High throughput (${reqPerSec.toFixed(0)} req/s)`)
  } else if (reqPerSec > 100) {
    assessment.push(`⚠️ Moderate throughput (${reqPerSec.toFixed(0)} req/s)`)
  } else {
    assessment.push(`❌ Low throughput (${reqPerSec.toFixed(0)} req/s)`)
  }

  return { analysis, assessment }
}

// Main execution
async function main() {
  const testNames = process.argv.slice(2)
  const testsToRun = testNames.length > 0 
    ? testNames.filter(t => tests[t])
    : Object.keys(tests)

  if (testsToRun.length === 0) {
    console.log('Available tests:', Object.keys(tests).join(', '))
    process.exit(1)
  }

  console.log('\n🚀 Starting Load Tests')
  console.log(`Tests to run: ${testsToRun.join(', ')}`)

  const results = []

  for (const testName of testsToRun) {
    try {
      const result = await runTest(testName, tests[testName])
      const { analysis, assessment } = analyzeResult(testName, result)
      
      console.log('\n📊 Results:')
      console.log(`   Requests/sec: ${analysis.requests.average.toFixed(2)}`)
      console.log(`   Latency avg: ${analysis.latency.average.toFixed(2)}ms`)
      console.log(`   Latency p99: ${analysis.latency.p99.toFixed(2)}ms`)
      console.log(`   Errors: ${analysis.errors}`)
      console.log(`   Timeouts: ${analysis.timeouts}`)
      console.log('\n📋 Assessment:')
      assessment.forEach(a => console.log(`   ${a}`))

      results.push({ testName, analysis, assessment })
    } catch (error) {
      console.error(`Error running ${testName}:`, error.message)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📈 LOAD TEST SUMMARY')
  console.log('='.repeat(60))
  
  results.forEach(r => {
    console.log(`\n${r.testName}:`)
    console.log(`   ${r.analysis.requests.average.toFixed(0)} req/s | p99: ${r.analysis.latency.p99.toFixed(0)}ms | errors: ${r.analysis.errors}`)
  })

  // Write results to file
  const fs = require('fs')
  const reportPath = `./load-tests/report-${Date.now()}.json`
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
  console.log(`\n📁 Full report saved to: ${reportPath}`)
}

main().catch(console.error)
