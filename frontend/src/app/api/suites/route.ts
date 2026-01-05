/**
 * Suites API
 * 
 * Returns WebWaka suites and solutions configuration.
 * Read-only endpoint for marketing and app navigation.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllSuites,
  getActiveSuites,
  getSuiteById,
  getSolutionsForSuite,
  getActiveSolutions,
  getSolutionByKey,
  SuiteId,
} from '@/config/suites'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  try {
    switch (action) {
      case 'all-suites': {
        const suites = getAllSuites()
        return NextResponse.json({ success: true, suites })
      }
      
      case 'active-suites': {
        const suites = getActiveSuites()
        return NextResponse.json({ success: true, suites })
      }
      
      case 'suite': {
        const id = searchParams.get('id') as SuiteId
        if (!id) {
          return NextResponse.json({ success: false, error: 'Suite ID required' }, { status: 400 })
        }
        const suite = getSuiteById(id)
        if (!suite) {
          return NextResponse.json({ success: false, error: 'Suite not found' }, { status: 404 })
        }
        const solutions = getSolutionsForSuite(id)
        return NextResponse.json({ success: true, suite, solutions })
      }
      
      case 'all-solutions': {
        const solutions = getActiveSolutions()
        return NextResponse.json({ success: true, solutions })
      }
      
      case 'solution': {
        const key = searchParams.get('key')
        if (!key) {
          return NextResponse.json({ success: false, error: 'Solution key required' }, { status: 400 })
        }
        const solution = getSolutionByKey(key)
        if (!solution) {
          return NextResponse.json({ success: false, error: 'Solution not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true, solution })
      }
      
      default: {
        // Return overview
        const suites = getAllSuites()
        const solutions = getActiveSolutions()
        return NextResponse.json({
          success: true,
          platform: 'WebWaka',
          suiteCount: suites.length,
          activeSuiteCount: suites.filter(s => s.status === 'active').length,
          solutionCount: solutions.length,
          suites: suites.map(s => ({
            id: s.id,
            name: s.name,
            status: s.status,
            moduleCount: s.modules.length,
          })),
        })
      }
    }
  } catch (error) {
    console.error('Suites API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
