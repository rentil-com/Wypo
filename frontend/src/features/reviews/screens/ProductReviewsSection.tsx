import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { ProductReviewsResponse } from '../reviews.types';

type ProductReviewsSectionProps = {
  reviews: ProductReviewsResponse | null;
  loading?: boolean;
  error?: string | null;
};
function formatReviewDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ProductReviewsSection({
  reviews,
  loading = false,
  error = null,
}: ProductReviewsSectionProps) {
    
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>OPINIE KLIENTÓW</Text>
          <Text style={styles.title}>Recenzje produktu</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{reviews?.liczba_recenzji ?? 0} opinii</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.average}>{reviews?.srednia_ocen.toFixed(1) ?? '0.0'}</Text>
        <View style={styles.summaryDetails}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons
                key={star}
                name={'star'}
                size={22}
                color={star <= Math.round(reviews?.srednia_ocen ?? 0) ? '#F59E0B' : '#CBD5E1'}
              />
            ))}
          </View>
          <Text style={styles.summaryText}>
            Na podstawie {reviews?.liczba_recenzji ?? 0} recenzji
          </Text>
        </View>
      </View>
      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator size={'large'} color={'#176BDE'} />
          <Text style={styles.stateText}>Ładowanie recenzji...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.stateBox}>
          <MaterialIcons name={'error-outline'} size={30} color={'#DC2626'} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && reviews?.dane.length === 0 && (
        <View style={styles.stateBox}>
          <MaterialIcons name={'rate-review'} size={34} color={'#94A3B8'} />
          <Text style={styles.stateText}>Ten produkt nie ma jeszcze recenzji.</Text>
        </View>
      )}

      {!loading && !error && reviews && reviews.dane.length > 0 && (
        <View style={styles.reviewList}>
          {reviews.dane.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <MaterialIcons name={'person'} size={22} color={'#176BDE'} />
                </View>
                <View style={styles.authorDetails}>
                  <Text style={styles.authorName}>
                    {[review.imie, review.nazwisko].filter(Boolean).join(' ') || 'Użytkownik'}
                  </Text>
                  <Text style={styles.reviewDate}>{formatReviewDate(review.data_dodania)}</Text>
                </View>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialIcons
                      key={star}
                      name={'star'}
                      size={17}
                      color={star <= review.gwiazdki ? '#F59E0B' : '#CBD5E1'}
                    />
                  ))}
                </View>
              </View>
              {review.tresc && <Text style={styles.reviewContent}>{review.tresc}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    marginTop: 28,
    padding: 28,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 24,
  },
  eyebrow: {
    marginBottom: 5,
    color: '#176BDE',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '900',
  },
  countBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EEF4FF',
  },
  countText: {
    color: '#176BDE',
    fontSize: 13,
    fontWeight: '800',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 26,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
  },
  average: {
    color: '#0F172A',
    fontSize: 42,
    fontWeight: '900',
  },
  summaryDetails: {
    gap: 5,
  },
  stars: {
    flexDirection: 'row',
    gap: 3,
  },
  summaryText: {
    color: '#64748B',
    fontSize: 13,
  },
  stateBox: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateText: {
    color: '#64748B',
    fontSize: 15,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 15,
    textAlign: 'center',
  },
  reviewList: {
    gap: 14,
  },
  reviewCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF4FF',
  },
  authorDetails: {
    flex: 1,
    gap: 3,
  },
  authorName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  reviewDate: {
    color: '#94A3B8',
    fontSize: 12,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewContent: {
    marginTop: 14,
    color: '#475569',
    fontSize: 14,
    lineHeight: 22,
  },
});
