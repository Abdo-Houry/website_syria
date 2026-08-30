import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { booksApi } from "@/api/books.api";
import { challengesApi } from "@/api/challenges.api";
import { stampsApi } from "@/api/stamps.api";
import { userBooksApi } from "@/api/user-books.api";
import { isUserBookDeleted } from "@/features/books/booklet-card";
import { visitsApi } from "@/api/visits.api";
import { queryKeys } from "@/app/query-client";
import { useAuth } from "@/context/auth-context";
import { percent } from "@/lib/utils";
import type {
  Book,
  Challenge,
  Place,
  Stamp,
  UserBook,
  UserChallenge,
  UserStamp,
  UserVisit,
} from "@/types/api";

const ACTIVE_BOOK_STORAGE_KEY = "tourist.activeUserBookId";

function readStoredActiveId(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVE_BOOK_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function storeActiveId(id: number | null) {
  try {
    if (id === null) localStorage.removeItem(ACTIVE_BOOK_STORAGE_KEY);
    else localStorage.setItem(ACTIVE_BOOK_STORAGE_KEY, String(id));
  } catch {
    /* التخزين معطّل */
  }
}

export interface JourneyProgress {
  placesVisited: number;
  placesTotal: number;
  challengesDone: number;
  challengesTotal: number;
  stampsCollected: number;
  stampsTotal: number;
  /** نسبة إنجاز موحّدة عبر المحاور الثلاثة. */
  overall: number;
}

interface JourneyContextValue {
  /** كل الكتيّبات التي يملكها المستخدم. */
  userBooks: UserBook[];
  isLoadingBooks: boolean;
  booksError: unknown;
  refetchUserBooks: () => void;

  /** نسخة الكتيّب النشطة — سياق الرحلة الحالي. */
  activeUserBook: UserBook | null;
  setActiveUserBookId: (id: number | null) => void;

  /** محتوى الكتيّب النشط (أماكن، تحديات، طوابع، شركاء، محافظة). */
  book: Book | null;
  isLoadingBook: boolean;
  bookError: unknown;

  province: Book["province"] | null;
  /** كل أماكن الكتيّب — بما فيها أماكن الاستكشاف التعريفية. */
  places: Place[];
  challenges: Challenge[];
  stamps: Stamp[];
  partners: NonNullable<Book["partners"]>;

  /** تقدّم المستخدم — مُصفّى على محتوى الكتيّب النشط فقط. */
  visits: UserVisit[];
  myChallenges: UserChallenge[];
  myStamps: UserStamp[];
  progress: JourneyProgress;
  isLoadingProgress: boolean;

  isPlaceVisited: (placeId: number) => boolean;
  isProvinceVisited: (provinceId: number) => boolean;
  isChallengeCompleted: (challengeId: number) => boolean;
  isStampCollected: (stampId: number) => boolean;
  /** هل السيريال/الإصدار الممسوح يخصّ كتيّباً يملكه المستخدم؟ */
  findUserBookBySerial: (serial: string, version: string) => UserBook | null;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

const EMPTY_PROGRESS: JourneyProgress = {
  placesVisited: 0,
  placesTotal: 0,
  challengesDone: 0,
  challengesTotal: 0,
  stampsCollected: 0,
  stampsTotal: 0,
  overall: 0,
};

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const enabled = status === "authenticated";

  const [activeId, setActiveId] = useState<number | null>(() => readStoredActiveId());

  const userBooksQuery = useQuery({
    queryKey: queryKeys.userBooks,
    queryFn: userBooksApi.mine,
    enabled,
  });

  const userBooks = useMemo(
    () => userBooksQuery.data ?? [],
    [userBooksQuery.data],
  );

  /*
    اختيار جواز نشط صالح: المخزَّن إن كان لا يزال مملوكاً وغير محذوف،
    وإلا الأحدث من غير المحذوفة. النسخ المحذوفة تبقى في القائمة للعرض
    الرمادي فقط.

    الشرط الأول جوهري: أثناء تحميل القائمة تكون `userBooks` فارغة، وبدون
    هذا الحرس يُمسح الاختيار المخزَّن عند كل إعادة تحميل ثم يُستبدل بأحدث
    جواز — فيجد المستخدم نفسه في جواز غير الذي كان فيه بعد كل ريفريش.
  */
  useEffect(() => {
    if (!enabled || userBooksQuery.isPending) return;

    const usable = userBooks.filter((item) => !isUserBookDeleted(item));
    if (!usable.length) {
      if (activeId !== null) {
        setActiveId(null);
        storeActiveId(null);
      }
      return;
    }
    const stillOwned = usable.some((item) => item.id === activeId);
    if (!stillOwned) {
      const fallback = usable[usable.length - 1]!.id;
      setActiveId(fallback);
      storeActiveId(fallback);
    }
  }, [userBooks, activeId, enabled, userBooksQuery.isPending]);

  const setActiveUserBookId = useCallback((id: number | null) => {
    setActiveId(id);
    storeActiveId(id);
  }, []);

  const activeUserBook = useMemo(
    () => userBooks.find((item) => item.id === activeId) ?? null,
    [userBooks, activeId],
  );

  const bookId = activeUserBook?.book_copy?.book?.id;

  /**
   * محتوى الكتيّب الكامل. `GET /users/books` يعيد الكتاب بدون علاقاته،
   * لذلك نجلب `GET /books/:id` للحصول على الأماكن والتحديات والطوابع والشركاء.
   */
  const bookQuery = useQuery({
    queryKey: bookId ? queryKeys.book(bookId) : ["book", "none"],
    queryFn: () => booksApi.byId(bookId!),
    enabled: enabled && !!bookId,
    staleTime: 10 * 60_000,
  });

  /*
    تقدّم المستخدم مقيّد بنسخة الكتيّب النشط على مستوى الخادم
    (باراميتر userBookId)، فلا يختلط تقدّم كتيّب بآخر حتى لو
    تكرّر المكان نفسه في كتيّبين.
  */
  const activeUserBookId = activeUserBook?.id;

  const visitsQuery = useQuery({
    queryKey: queryKeys.visits(activeUserBookId),
    queryFn: () => visitsApi.mine(activeUserBookId),
    enabled: enabled && !!activeUserBookId,
  });

  const challengesQuery = useQuery({
    queryKey: queryKeys.myChallenges(activeUserBookId),
    queryFn: () => challengesApi.mine(activeUserBookId),
    enabled: enabled && !!activeUserBookId,
  });

  const stampsQuery = useQuery({
    queryKey: queryKeys.myStamps(activeUserBookId),
    queryFn: () => stampsApi.mine(activeUserBookId),
    enabled: enabled && !!activeUserBookId,
  });

  const book = bookQuery.data ?? null;

  const places = useMemo(() => book?.places ?? [], [book]);

  /*
    أماكن الاستكشاف تعريفية بلا رمز QR، فلا تُوثَّق زيارتها أبداً.
    إدخالها في المقام يجعل بلوغ 100% مستحيلاً — لذلك تُحسب النِسَب
    على الأماكن القابلة للتوثيق وحدها.
  */
  const trackedPlaces = useMemo(
    () => places.filter((place) => !place.is_exploration),
    [places],
  );

  const challenges = useMemo(() => book?.challenges ?? [], [book]);
  const stamps = useMemo(() => book?.stamps ?? [], [book]);
  const partners = useMemo(() => book?.partners ?? [], [book]);
  const province = book?.province ?? null;

  /*
    الخادم يعيد سجلات الكتيّب النشط وحده. نُبقي تصفية إضافية على معرّفات
    محتوى الكتيّب لأننا نحتاجها أصلاً لحساب النسب (كم مكاناً من أماكن
    الكتيّب زُير)، وهي في الوقت نفسه طبقة أمان إن تغيّر سلوك الخادم.
  */
  const placeIds = useMemo(
    () => new Set(trackedPlaces.map((p) => p.id)),
    [trackedPlaces],
  );
  const challengeIds = useMemo(
    () => new Set(challenges.map((c) => c.id)),
    [challenges],
  );
  const stampIds = useMemo(() => new Set(stamps.map((s) => s.id)), [stamps]);

  const visits = useMemo(() => {
    const all = visitsQuery.data ?? [];
    if (!book) return [];
    return all.filter((visit) => {
      if (visit.place) return placeIds.has(visit.place.id);
      if (visit.province) return visit.province.id === province?.id;
      return false;
    });
  }, [visitsQuery.data, book, placeIds, province?.id]);

  const myChallenges = useMemo(() => {
    const all = challengesQuery.data ?? [];
    if (!book) return [];
    return all.filter((item) => item.challenge && challengeIds.has(item.challenge.id));
  }, [challengesQuery.data, book, challengeIds]);

  const myStamps = useMemo(() => {
    const all = stampsQuery.data ?? [];
    if (!book) return [];
    return all.filter((item) => item.stamp && stampIds.has(item.stamp.id));
  }, [stampsQuery.data, book, stampIds]);

  const visitedPlaceIds = useMemo(
    () =>
      new Set(
        visits
          .filter((visit) => visit.place)
          .map((visit) => visit.place!.id),
      ),
    [visits],
  );

  const visitedProvinceIds = useMemo(
    () =>
      new Set(
        visits
          .filter((visit) => visit.province)
          .map((visit) => visit.province!.id),
      ),
    [visits],
  );

  const completedChallengeIds = useMemo(
    () =>
      new Set(
        myChallenges
          .filter((item) => item.completed && item.challenge)
          .map((item) => item.challenge!.id),
      ),
    [myChallenges],
  );

  const collectedStampIds = useMemo(
    () => new Set(myStamps.filter((item) => item.stamp).map((item) => item.stamp!.id)),
    [myStamps],
  );

  const progress = useMemo<JourneyProgress>(() => {
    if (!book) return EMPTY_PROGRESS;

    const placesVisited = trackedPlaces.filter((place) =>
      visitedPlaceIds.has(place.id),
    ).length;
    const challengesDone = challenges.filter((challenge) =>
      completedChallengeIds.has(challenge.id),
    ).length;
    const stampsCollected = stamps.filter((stamp) =>
      collectedStampIds.has(stamp.id),
    ).length;

    const done = placesVisited + challengesDone + stampsCollected;
    const total = trackedPlaces.length + challenges.length + stamps.length;

    return {
      placesVisited,
      placesTotal: trackedPlaces.length,
      challengesDone,
      challengesTotal: challenges.length,
      stampsCollected,
      stampsTotal: stamps.length,
      overall: percent(done, total),
    };
  }, [
    book,
    trackedPlaces,
    challenges,
    stamps,
    visitedPlaceIds,
    completedChallengeIds,
    collectedStampIds,
  ]);

  const findUserBookBySerial = useCallback(
    (serial: string, version: string) =>
      userBooks.find(
        (item) =>
          item.book_copy?.serial_number === serial &&
          item.book_copy?.version === version,
      ) ?? null,
    [userBooks],
  );

  const value = useMemo<JourneyContextValue>(
    () => ({
      userBooks,
      isLoadingBooks: userBooksQuery.isPending && enabled,
      booksError: userBooksQuery.error,
      refetchUserBooks: () => void userBooksQuery.refetch(),

      activeUserBook,
      setActiveUserBookId,

      book,
      isLoadingBook: bookQuery.isPending && !!bookId,
      bookError: bookQuery.error,

      province,
      places,
      challenges,
      stamps,
      partners,

      visits,
      myChallenges,
      myStamps,
      progress,
      isLoadingProgress:
        !!activeUserBookId &&
        (visitsQuery.isPending ||
          challengesQuery.isPending ||
          stampsQuery.isPending),

      isPlaceVisited: (placeId: number) => visitedPlaceIds.has(placeId),
      isProvinceVisited: (provinceId: number) => visitedProvinceIds.has(provinceId),
      isChallengeCompleted: (challengeId: number) =>
        completedChallengeIds.has(challengeId),
      isStampCollected: (stampId: number) => collectedStampIds.has(stampId),
      findUserBookBySerial,
    }),
    [
      userBooks,
      userBooksQuery,
      enabled,
      activeUserBook,
      setActiveUserBookId,
      book,
      bookQuery,
      bookId,
      province,
      places,
      challenges,
      stamps,
      partners,
      visits,
      myChallenges,
      myStamps,
      progress,
      activeUserBookId,
      visitsQuery.isPending,
      challengesQuery.isPending,
      stampsQuery.isPending,
      visitedPlaceIds,
      visitedProvinceIds,
      completedChallengeIds,
      collectedStampIds,
      findUserBookBySerial,
    ],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error("useJourney must be used inside <JourneyProvider>");
  }
  return context;
}
