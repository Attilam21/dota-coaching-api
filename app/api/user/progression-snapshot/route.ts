import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/user/progression-snapshot
 * Get user's progression snapshot (percentiles, rankings) from OpenDota
 * Compares with previous snapshot to show progress
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Dota account ID from profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('dota_account_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile?.dota_account_id) {
      return NextResponse.json(
        { error: 'Dota account ID not found. Please link your account in settings.' },
        { status: 404 }
      )
    }

    const dotaAccountId = userProfile.dota_account_id

    // Fetch current ratings from OpenDota
    const ratingsResponse = await fetch(
      `https://api.opendota.com/api/players/${dotaAccountId}/ratings`,
      { next: { revalidate: 3600 } }
    )

    if (!ratingsResponse.ok) {
      console.error('Failed to fetch ratings from OpenDota')
      return NextResponse.json(
        { error: 'Failed to fetch progression data' },
        { status: 500 }
      )
    }

    const ratings = await ratingsResponse.json()
    
    // Fetch rankings from OpenDota
    const rankingsResponse = await fetch(
      `https://api.opendota.com/api/players/${dotaAccountId}/rankings`,
      { next: { revalidate: 3600 } }
    )

    let rankings = null
    if (rankingsResponse.ok) {
      rankings = await rankingsResponse.json()
    }

    // Get latest snapshot from database
    const { data: latestSnapshot, error: snapshotError } = await supabase
      .from('user_performance_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()

    // Get previous snapshot for comparison
    const { data: previousSnapshot } = await supabase
      .from('user_performance_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })
      .limit(2)
      .offset(1)
      .single()

    // Extract current data
    const currentData = {
      gpmPercentile: ratings.find((r: any) => r.account_id === dotaAccountId)?.gpm_percentile,
      xpmPercentile: ratings.find((r: any) => r.account_id === dotaAccountId)?.xpm_percentile,
      kdaPercentile: ratings.find((r: any) => r.account_id === dotaAccountId)?.kda_percentile,
      globalRank: rankings?.rank || null,
      countryRank: rankings?.country_rank || null,
      winrate: null as number | null,
      totalWins: null as number | null,
      totalLosses: null as number | null
    }

    // Fetch winrate from player profile (simplified - you might want to calculate from matches)
    const profileResponse = await fetch(
      `https://api.opendota.com/api/players/${dotaAccountId}`,
      { next: { revalidate: 3600 } }
    )

    if (profileResponse.ok) {
      const profile = await profileResponse.json()
      if (profile.win && profile.lose) {
        currentData.totalWins = profile.win
        currentData.totalLosses = profile.lose
        currentData.winrate = (profile.win / (profile.win + profile.lose)) * 100
      }
    }

    // Return current data with previous for comparison
    return NextResponse.json({
      current: {
        gpm: {
          percentile: currentData.gpmPercentile,
          value: null // You can calculate from ratings if needed
        },
        xpm: {
          percentile: currentData.xpmPercentile,
          value: null
        },
        kda: {
          percentile: currentData.kdaPercentile,
          value: null
        },
        globalRank: currentData.globalRank,
        countryRank: currentData.countryRank,
        winrate: currentData.winrate,
        totalWins: currentData.totalWins,
        totalLosses: currentData.totalLosses
      },
      previous: previousSnapshot ? {
        gpmPercentile: previousSnapshot.gpm_percentile,
        xpmPercentile: previousSnapshot.xpm_percentile,
        kdaPercentile: previousSnapshot.kda_percentile,
        globalRank: previousSnapshot.global_rank,
        winrate: previousSnapshot.winrate
      } : null,
      lastSnapshotDate: latestSnapshot?.snapshot_date || null
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('Error in /api/user/progression-snapshot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/progression-snapshot
 * Create a new progression snapshot (should be called periodically)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Dota account ID
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('dota_account_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile?.dota_account_id) {
      return NextResponse.json(
        { error: 'Dota account ID not found' },
        { status: 404 }
      )
    }

    const dotaAccountId = userProfile.dota_account_id
    const today = new Date().toISOString().split('T')[0]

    // Fetch current data from OpenDota
    const [ratingsResponse, rankingsResponse, profileResponse] = await Promise.all([
      fetch(`https://api.opendota.com/api/players/${dotaAccountId}/ratings`, { next: { revalidate: 3600 } }),
      fetch(`https://api.opendota.com/api/players/${dotaAccountId}/rankings`, { next: { revalidate: 3600 } }),
      fetch(`https://api.opendota.com/api/players/${dotaAccountId}`, { next: { revalidate: 3600 } })
    ])

    const ratings = ratingsResponse.ok ? await ratingsResponse.json() : []
    const rankings = rankingsResponse.ok ? await rankingsResponse.json() : null
    const profile = profileResponse.ok ? await profileResponse.json() : null

    const ratingData = ratings.find((r: any) => r.account_id === dotaAccountId)

    // Prepare snapshot data
    const snapshotData = {
      user_id: user.id,
      dota_account_id: dotaAccountId,
      snapshot_date: today,
      gpm_percentile: ratingData?.gpm_percentile || null,
      xpm_percentile: ratingData?.xpm_percentile || null,
      kda_percentile: ratingData?.kda_percentile || null,
      global_rank: rankings?.rank || null,
      country_rank: rankings?.country_rank || null,
      winrate: profile?.win && profile?.lose 
        ? (profile.win / (profile.win + profile.lose)) * 100 
        : null,
      total_wins: profile?.win || null,
      total_losses: profile?.lose || null
    }

    // Insert or update snapshot (ON CONFLICT will update if exists)
    const { data: snapshot, error: insertError } = await supabase
      .from('user_performance_snapshots')
      .upsert(snapshotData, {
        onConflict: 'user_id,snapshot_date'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating snapshot:', insertError)
      return NextResponse.json(
        { error: 'Failed to create snapshot' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      snapshot
    })
  } catch (error) {
    console.error('Error in POST /api/user/progression-snapshot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

