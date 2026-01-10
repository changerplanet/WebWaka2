/**
 * CIVIC SUITE: Voting API
 * 
 * GET - List polls, get results
 * POST - Create polls, cast votes, manage poll lifecycle
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPolls,
  getPollById,
  getActivePolls,
  createPoll,
  updatePoll,
  schedulePoll,
  activatePoll,
  closePoll,
  declareResults,
  cancelPoll,
  castVote,
  hasVoted,
  getPollResults,
  getPollStats,
} from '@/lib/civic/voting-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const { searchParams } = new URL(request.url);
    
    // Check for single poll fetch
    const id = searchParams.get('id');
    if (id) {
      const poll = await getPollById(tenantId, id);
      if (!poll) {
        return NextResponse.json(
          { success: false, error: 'Poll not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, poll });
    }
    
    // Check for results
    const resultsId = searchParams.get('results');
    if (resultsId) {
      try {
        const results = await getPollResults(tenantId, resultsId);
        if (!results) {
          return NextResponse.json(
            { success: false, error: 'Poll not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, ...results });
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }
    
    // Check for active polls
    const listType = searchParams.get('list');
    if (listType === 'active') {
      const active = await getActivePolls(tenantId);
      return NextResponse.json({ success: true, polls: active });
    }
    
    // Check if voter has voted
    const checkVoterId = searchParams.get('checkVoted');
    const pollId = searchParams.get('pollId');
    if (checkVoterId && pollId) {
      const voted = await hasVoted(pollId, checkVoterId);
      return NextResponse.json({ success: true, hasVoted: voted });
    }
    
    // Check for stats only
    if (searchParams.get('statsOnly') === 'true') {
      const stats = await getPollStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }
    
    // Get list with filters
    const options = {
      status: searchParams.get('status') as any,
      type: searchParams.get('type') as any,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    
    const result = await getPolls(tenantId, options);
    
    return NextResponse.json({
      success: true,
      ...result,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(result.total / options.limit),
    });
  } catch (error) {
    console.error('Voting API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch polls' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const body = await request.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'vote':
        if (!data.pollId || !data.voterId || !data.selections) {
          return NextResponse.json(
            { success: false, error: 'Poll ID, voter ID, and selections required' },
            { status: 400 }
          );
        }
        const voteResult = await castVote(data.pollId, data.voterId, data.selections);
        return NextResponse.json({
          success: voteResult.success,
          message: voteResult.message,
        }, { status: voteResult.success ? 200 : 400 });
        
      case 'schedule':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Poll ID required' },
            { status: 400 }
          );
        }
        const scheduled = await schedulePoll(tenantId, data.id);
        if (!scheduled) {
          return NextResponse.json(
            { success: false, error: 'Poll not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          poll: scheduled,
          message: 'Poll scheduled',
        });
        
      case 'activate':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Poll ID required' },
            { status: 400 }
          );
        }
        const activated = await activatePoll(tenantId, data.id);
        if (!activated) {
          return NextResponse.json(
            { success: false, error: 'Poll not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          poll: activated,
          message: 'Voting is now open',
        });
        
      case 'close':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Poll ID required' },
            { status: 400 }
          );
        }
        const closed = await closePoll(tenantId, data.id);
        if (!closed) {
          return NextResponse.json(
            { success: false, error: 'Poll not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          poll: closed,
          message: 'Voting closed. Results calculated.',
        });
        
      case 'declare-results':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Poll ID required' },
            { status: 400 }
          );
        }
        try {
          const declared = await declareResults(tenantId, data.id);
          if (!declared) {
            return NextResponse.json(
              { success: false, error: 'Poll not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            poll: declared,
            message: 'Results declared',
          });
        } catch (error: any) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
          );
        }
        
      case 'cancel':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Poll ID required' },
            { status: 400 }
          );
        }
        const cancelled = await cancelPoll(tenantId, data.id);
        if (!cancelled) {
          return NextResponse.json(
            { success: false, error: 'Poll not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          poll: cancelled,
          message: 'Poll cancelled',
        });
        
      case 'update':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Poll ID required' },
            { status: 400 }
          );
        }
        try {
          const updated = await updatePoll(tenantId, data.id, data);
          if (!updated) {
            return NextResponse.json(
              { success: false, error: 'Poll not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            poll: updated,
            message: 'Poll updated',
          });
        } catch (error: any) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
          );
        }
        
      default:
        // Create new poll
        if (!data.pollType || !data.title || !data.votingStart || !data.votingEnd) {
          return NextResponse.json(
            { success: false, error: 'Poll type, title, and voting dates required' },
            { status: 400 }
          );
        }
        const poll = await createPoll(tenantId, {
          ...data,
          createdBy: data.createdBy || 'admin',
        });
        return NextResponse.json({
          success: true,
          poll,
          message: 'Poll created successfully',
        }, { status: 201 });
    }
  } catch (error) {
    console.error('Voting API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process voting request' },
      { status: 500 }
    );
  }
}
