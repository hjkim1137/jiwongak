-- 0004_set_timezone_kst.sql
-- DB 기본 타임존을 UTC → Asia/Seoul(KST, UTC+9)로 변경.
-- timestamptz 컬럼의 내부 저장값(UTC)은 유지되고
-- 표시 및 now() 기본값이 KST 기준으로 바뀜.

ALTER DATABASE postgres SET timezone TO 'Asia/Seoul';
