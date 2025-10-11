import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Fuzzy matching function to find similar strings
function fuzzyMatch(searchTerm: string, candidate: string): number {
  const search = searchTerm.toLowerCase();
  const target = candidate.toLowerCase();
  
  // Exact match scores highest
  if (target === search) return 100;
  
  // Starts with match
  if (target.startsWith(search)) return 90;
  
  // Contains match
  if (target.includes(search)) return 80;
  
  // Calculate Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(search, target);
  const maxLength = Math.max(search.length, target.length);
  const similarity = ((maxLength - distance) / maxLength) * 70;
  
  return similarity;
}

// Levenshtein distance algorithm for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        ) ;
      }
    }
  }
  
  return dp[m][n];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get("field");
    const search = searchParams.get("q") || "";
    
    if (!field) {
      return NextResponse.json(
        { error: "Field parameter is required" },
        { status: 400 }
      );
    }
    
    // Fetch bilties to extract unique values
    const biltiesRef = collection(db, "bilties");
    const q = query(biltiesRef, orderBy("createdAt", "desc"), limit(500));
    const snapshot = await getDocs(q);
    
    const uniqueValues = new Set<string>();
    const valueScores = new Map<string, number>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      let value = "";
      
      // Extract value based on field
      switch (field) {
        case "consignor":
          value = data.consignorName || "";
          break;
        case "consignorGSTIN":
          value = data.consignorGSTIN || "";
          break;
        case "consignee":
          value = data.consigneeName || "";
          break;
        case "consigneeGSTIN":
          value = data.consigneeGSTIN || "";
          break;
        case "truck":
          value = data.truckNo || "";
          break;
        case "from":
          value = data.from || "";
          break;
        case "to":
          value = data.to || "";
          break;
        default:
          return;
      }
      
      if (value && value.trim()) {
        const trimmedValue = value.trim();
        uniqueValues.add(trimmedValue);
        
        // Calculate fuzzy match score
        if (search) {
          const score = fuzzyMatch(search, trimmedValue);
          if (score > 30) { // Only include if similarity > 30%
            valueScores.set(trimmedValue, score);
          }
        }
      }
    });
    
    // Convert to array and sort by relevance
    let suggestions = Array.from(uniqueValues);
    
    if (search) {
      // Filter and sort by fuzzy match score
      suggestions = suggestions
        .filter(v => valueScores.has(v))
        .sort((a, b) => {
          const scoreA = valueScores.get(a) || 0;
          const scoreB = valueScores.get(b) || 0;
          return scoreB - scoreA;
        })
        .slice(0, 10); // Limit to top 10 matches
    } else {
      // No search term - return most recent unique values
      suggestions = suggestions.slice(0, 10);
    }
    
    // Return suggestions with metadata
    const results = suggestions.map(value => ({
      value,
      label: value,
      score: valueScores.get(value) || 0,
      field
    }));
    
    return NextResponse.json({ suggestions: results });
    
  } catch (error: any) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions", details: error.message },
      { status: 500 }
    );
  }
}
