import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BottomChatBar } from './components/BottomChatBar';
import { ChatOverlayModal } from './components/ChatOverlayModal';
import { ProfileModal } from './components/ProfileModal';
import { StudentHeader } from './components/StudentHeader';
import { SubscriptionCheckoutModal } from './components/SubscriptionCheckoutModal';
import { TryForOneBobModal } from './components/TryForOneBobModal';
import { useKitabuApp } from './hooks/useKitabuApp';
import { LoginScreen } from './screens/LoginScreen';
import { AdminPortalScreen } from './screens/AdminPortalScreen';
import { BookReaderScreen } from './screens/BookReaderScreen';
import { BookshelfScreen } from './screens/BookshelfScreen';
import { BrainTeaseScreen } from './screens/BrainTeaseScreen';
import { CrazyBalloonScreen } from './screens/CrazyBalloonScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { GameZoneScreen } from './screens/GameZoneScreen';
import { HomeworkListScreen } from './screens/HomeworkListScreen';
import { HomeworkQuizScreen } from './screens/HomeworkQuizScreen';
import { IntroCarouselScreen } from './screens/IntroCarouselScreen';
import { LetsLearnContentScreen } from './screens/LetsLearnContentScreen';
import { LetsLearnListScreen } from './screens/LetsLearnListScreen';
import { LiveAudioTutorScreen } from './screens/LiveAudioTutorScreen';
import { PodcastsScreen } from './screens/PodcastsScreen';
import { QuackGameScreen } from './screens/QuackGameScreen';
import { QuizMeScreen } from './screens/QuizMeScreen';
import { SubjectScreen } from './screens/SubjectScreen';
import { StudentOnboardingScreen } from './screens/StudentOnboardingScreen';
import { TakeQuizScreen } from './screens/TakeQuizScreen';
import { TeacherPortalScreen } from './screens/TeacherPortalScreen';

const logo = require('./assets/logo.png');

export function KitabuApp() {
  const { state, actions } = useKitabuApp();
  const usesStudentHeader = shouldUseStudentHeader(state.currentView);
  const usesStandaloneScreen = shouldUseStandaloneScreen(state.currentView);

  if (!state.isReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.bootstrapWrap}>
          <Image source={logo} style={styles.bootstrapLogo} resizeMode="contain" />
        </View>
      </SafeAreaView>
    );
  }

  if (!state.authSession) {
    if (state.authEntryScreen === 'intro') {
      return (
        <SafeAreaView style={styles.safeArea}>
          <IntroCarouselScreen
            onSignIn={actions.openSignInEntry}
            onCreateAccount={actions.openSignupEntry}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <LoginScreen
          mode={state.authMode}
          email={state.loginEmail}
          password={state.loginPassword}
          fullName={state.signupFullName}
          signupRole={state.signupRole}
          error={state.authError}
          isSubmitting={state.isAuthenticating}
          onModeChange={actions.setAuthMode}
          onEmailChange={actions.setLoginEmail}
          onPasswordChange={actions.setLoginPassword}
          onFullNameChange={actions.setSignupFullName}
          onSignupRoleChange={actions.setSignupRole}
          onSubmit={state.authMode === 'login' ? actions.signIn : actions.signUp}
        />
      </SafeAreaView>
    );
  }

  if (state.hasPendingStudentOnboarding) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StudentOnboardingScreen
          schools={state.schoolsList}
          isSubmitting={state.isSubmittingOnboarding}
          error={state.onboardingError}
          onSubmit={actions.submitStudentOnboarding}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {usesStudentHeader ? (
          <StudentHeader
            userAvatar={state.userProfile.avatar}
            onOpenProfile={() => actions.setProfileOpen(true)}
            showPreviewExit={state.isStudentPreview}
            onExitPreview={actions.exitStudentPreview}
          />
        ) : usesStandaloneScreen ? null : (
          <View style={styles.pageHeader}>
            <Text style={styles.brand}>KITABU</Text>
            <Text style={styles.pageTitle}>
              {getTitle(state.currentView, state.selectedSubject?.name)}
            </Text>
          </View>
        )}

        <View style={styles.screenWrap}>{renderScreen(state, actions)}</View>

        {state.currentView === 'dashboard' && !state.isStudentPreview ? (
          <BottomChatBar
            isLoading={state.isLoading}
            onSendMessage={message => actions.sendMessage(message)}
            onOpen={() => actions.setChatOpen(true)}
            onOpenLive={actions.openLiveTutorOverlay}
          />
        ) : null}

        <ProfileModal
          isOpen={state.profileOpen}
          onClose={() => actions.setProfileOpen(false)}
          onOpenAdmin={actions.openAdminPortal}
          onOpenTeacher={actions.openTeacherPortal}
          onSignOut={actions.signOut}
          showTeacherPortalButton={state.canOpenTeacherPortal}
          showAdminPortalButton={state.canOpenAdminPortal}
          canResendVerification={state.canResendVerification}
          onResendVerification={actions.resendVerificationEmail}
          billingStatus={state.billingStatus}
          onManageSubscription={() => {
            actions.setProfileOpen(false);
            actions.openSubscriptionCheckout({
              kind: 'manage_subscription',
              snapshot: {
                view: state.currentView,
                currentGrade: state.currentGrade,
                adminSelectedGrade: state.adminSelectedGrade,
                selectedSubjectId: state.selectedSubject?.id || null,
                selectedAssignmentId: state.selectedAssignment?.id || null,
                selectedSubStrandId: state.selectedSubStrand?.id || null,
                selectedBookId: state.selectedBook?.id || null,
                previewBookId: state.previewBookId,
                activeStrandIndex: state.activeStrandIndex,
                quizSource: state.quizSource,
                brainTeaseCompleted: state.brainTeaseCompleted,
                liveAudioReturnView: state.primaryHomeView,
              },
            });
          }}
          user={state.userProfile}
          onSave={updatedUser => {
            actions.setUserProfile(updatedUser);
            if (updatedUser.grade && updatedUser.grade !== state.currentGrade) {
              actions.setCurrentGrade(updatedUser.grade);
            }
          }}
          schools={state.schoolsList}
        />

        <ChatOverlayModal
          isOpen={state.chatOpen}
          isLoading={state.isLoading}
          messages={state.messages}
          startLiveAudio={state.startLiveAudio}
          onClose={actions.closeChat}
          onSendMessage={actions.sendMessage}
          onStartLiveAudio={actions.openLiveTutorOverlay}
          onCloseLiveAudio={() => actions.setStartLiveAudio(false)}
          onOpenLiveScreen={() => actions.openFeature('live_audio')}
        />

        <SubscriptionCheckoutModal
          isOpen={state.isCheckoutOpen}
          plans={state.billingPlans}
          selectedPlanCode={state.selectedPlanCode}
          phoneNumber={state.checkoutPhoneNumber}
          maskedSavedPhoneNumber={state.billingStatus.maskedMpesaPhoneNumber}
          isSubmitting={state.isSubmittingCheckout}
          statusLabel={state.checkoutStatusLabel}
          error={state.checkoutError}
          onClose={actions.closeSubscriptionCheckout}
          onSelectPlan={actions.setSelectedPlanCode}
          onChangePhoneNumber={actions.setCheckoutPhoneNumber}
          onUseSavedPhone={() =>
            actions.setCheckoutPhoneNumber(state.billingStatus.savedMpesaPhoneNumber || '')
          }
          onContinue={actions.submitSubscriptionCheckout}
        />

        <TryForOneBobModal
          isOpen={state.isTryOneBobOpen}
          isSubmitting={state.isSubmittingCheckout}
          phoneNumber={
            state.checkoutPhoneNumber || state.billingStatus.maskedMpesaPhoneNumber || 'your number'
          }
          onClose={actions.dismissTryOneBobOffer}
          onAccept={actions.acceptTryOneBobOffer}
        />

        {state.showComingSoon ? (
          <View pointerEvents="none" style={styles.comingSoonOverlay}>
            <View style={styles.comingSoonPill}>
              <Text style={styles.comingSoonText}>Coming Soon!</Text>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function shouldUseStudentHeader(view: string) {
  return ['dashboard', 'subject', 'bookshelf_view', 'podcasts_view', 'game_zone'].includes(
    view,
  );
}

function shouldUseStandaloneScreen(view: string) {
  return ['teachers_portal', 'admin_portal'].includes(view);
}

function renderScreen(
  state: ReturnType<typeof useKitabuApp>['state'],
  actions: ReturnType<typeof useKitabuApp>['actions'],
) {
  switch (state.currentView) {
    case 'subject':
      return state.selectedSubject ? (
        <SubjectScreen
          subject={state.selectedSubject}
          strands={state.selectedSubjectStrands}
          currentStrandIndex={state.activeStrandIndex}
          hasStudied={state.hasStudied}
          isBrainTeaseComplete={state.brainTeaseCompleted}
          isLoading={state.isLoading}
          onPrevStrand={() =>
            actions.setActiveStrandIndex(Math.max(0, state.activeStrandIndex - 1))
          }
          onNextStrand={() =>
            actions.setActiveStrandIndex(
              Math.min(
                state.selectedSubjectStrands.length - 1,
                state.activeStrandIndex + 1,
              ),
            )
          }
          onStartLearning={actions.startLearning}
          onStartBrainTease={actions.startSubjectBrainTease}
          onTakeQuiz={actions.startSubjectQuiz}
          onBack={actions.goHome}
        />
      ) : (
        <DashboardScreen
          banner={state.dashboardBanner}
          pendingAssignments={state.pendingAssignments}
          subjects={state.subjects}
          onOpenSubject={actions.openSubject}
          onOpenFeature={actions.openFeature}
          onBannerAction={actions.openBannerAction}
        />
      );
    case 'homework_list':
      return (
        <HomeworkListScreen
          assignments={state.assignments}
          onBack={actions.goHome}
          onStartAssignment={actions.startAssignment}
        />
      );
    case 'homework_quiz':
      return state.selectedAssignment ? (
        <HomeworkQuizScreen
          assignment={state.selectedAssignment}
          onClose={() => actions.openFeature('homework_list')}
          onSubmit={actions.submitAssignment}
        />
      ) : (
        <HomeworkListScreen
          assignments={state.assignments}
          onBack={actions.goHome}
          onStartAssignment={actions.startAssignment}
        />
      );
    case 'lets_learn_list':
      return (
        <LetsLearnListScreen
          strands={state.selectedSubjectStrands}
          subjectName={state.selectedSubject?.name || 'Subject'}
          grade={state.currentGrade}
          onBack={() => actions.openFeature('subject')}
          onSelectSubStrand={actions.selectSubStrand}
        />
      );
    case 'lets_learn_content':
      return state.selectedSubStrand ? (
        <LetsLearnContentScreen
          subStrand={state.selectedSubStrand}
          onClose={() => actions.openFeature('lets_learn_list')}
          onStartQuiz={() => {
            actions.startSelectedSubStrandQuiz();
          }}
        />
      ) : (
        <LetsLearnListScreen
          strands={state.selectedSubjectStrands}
          subjectName={state.selectedSubject?.name || 'Subject'}
          grade={state.currentGrade}
          onBack={() => actions.openFeature('subject')}
          onSelectSubStrand={actions.selectSubStrand}
        />
      );
    case 'bookshelf_view':
      return (
        <BookshelfScreen
          books={state.books}
          readingProgress={state.readingProgress}
          previewBookId={state.previewBookId}
          downloadedBooks={state.downloadedBooks}
          isSpotlightMode={state.isSpotlightMode}
          onOpenBook={actions.openBook}
          onBack={actions.goHome}
          onSetPreviewBookId={actions.setPreviewBookId}
          onToggleSpotlight={() => actions.setIsSpotlightMode(!state.isSpotlightMode)}
          onToggleDownload={actions.toggleDownload}
          user={state.userProfile}
        />
      );
    case 'reading_mode':
      return state.selectedBook ? (
        <BookReaderScreen
          book={state.selectedBook}
          initialPage={state.initialPage}
          isSpotlightMode={state.isSpotlightMode}
          isMuted={state.isMuted}
          onClose={actions.closeBookReader}
          onToggleMute={() => actions.setIsMuted(!state.isMuted)}
          onUpdateProgress={actions.updateBookProgress}
        />
      ) : (
        <BookshelfScreen
          books={state.books}
          readingProgress={state.readingProgress}
          previewBookId={state.previewBookId}
          downloadedBooks={state.downloadedBooks}
          isSpotlightMode={state.isSpotlightMode}
          onOpenBook={actions.openBook}
          onBack={actions.goHome}
          onSetPreviewBookId={actions.setPreviewBookId}
          onToggleSpotlight={() => actions.setIsSpotlightMode(!state.isSpotlightMode)}
          onToggleDownload={actions.toggleDownload}
          user={state.userProfile}
        />
      );
    case 'quiz_me_config':
      return (
        <QuizMeScreen
          isLoading={state.isLoading}
          strandsBySubject={state.quizMeStrandsBySubject}
          subStrandsByStrand={state.quizMeSubStrandsByStrand}
          onBack={actions.goHome}
          onGenerate={actions.generateQuizMe}
        />
      );
    case 'live_audio':
      return <LiveAudioTutorScreen onClose={actions.closeLiveAudio} />;
    case 'brain_tease':
      return (
        <BrainTeaseScreen
          cards={state.generatedFlashcards}
          subjectName={state.selectedSubject?.name}
          onClose={() => {
            if (state.quizSource === 'quiz_me') {
              actions.openFeature('quiz_me_config');
              return;
            }
            actions.openFeature('subject');
          }}
          onComplete={() => {
            if (state.quizSource === 'quiz_me') {
              actions.openFeature('quiz_me_config');
              return;
            }
            actions.setBrainTeaseCompleted(true);
            actions.openFeature('subject');
          }}
        />
      );
    case 'take_quiz':
      return (
        <TakeQuizScreen
          subjectName={state.selectedSubject?.name || 'General'}
          questions={state.generatedQuizQuestions}
          onFinish={
            state.quizSource === 'lesson' && state.lessonQuizSubStrandId
              ? async result => {
                  await actions.completeSubStrand(state.lessonQuizSubStrandId!, result.percentage);
                }
              : undefined
          }
          onClose={() => {
            if (state.quizSource === 'lesson') {
              actions.openFeature('lets_learn_content');
              return;
            }
            if (state.quizSource === 'quiz_me') {
              actions.openFeature('quiz_me_config');
              return;
            }
            actions.openFeature('subject');
          }}
        />
      );
    case 'game_zone':
      return (
        <GameZoneScreen
          totalPoints={state.userProfile.points || 0}
          onBack={actions.goHome}
          onPlayGame={actions.playGame}
        />
      );
    case 'quack_game':
      return (
        <QuackGameScreen
          onAddPoints={actions.addPoints}
          onBack={() => actions.openFeature('game_zone')}
        />
      );
    case 'crazy_balloon':
      return (
        <CrazyBalloonScreen
          onAddPoints={actions.addPoints}
          onBack={() => actions.openFeature('game_zone')}
        />
      );
    case 'podcasts_view':
      return <PodcastsScreen podcasts={state.podcasts} onBack={actions.goHome} />;
    case 'teachers_portal':
      return (
        <TeacherPortalScreen
          onBack={actions.goHome}
          onOpenStudentPreview={actions.openStudentPreview}
          students={state.teacherStudents}
          assignments={state.teacherAssignments}
          submissionsByAssignment={state.submissionsByAssignment}
          onPublishAssignment={actions.publishTeacherAssignment}
        />
      );
    case 'admin_portal':
      return (
        <AdminPortalScreen
          onBack={actions.goHome}
          currentGrade={state.adminSelectedGrade}
          subjects={state.subjects}
          curriculumData={state.curriculumData}
          schoolsList={state.schoolsList}
          users={state.adminUsers}
          schoolPlans={state.adminSchoolPlans}
          discounts={state.adminDiscounts}
          announcements={state.adminAnnouncements}
          userProfile={state.userProfile}
          onSelectGrade={actions.setAdminSelectedGrade}
          onCreateSchool={actions.createSchoolRecord}
          onUpdateSchoolRecord={actions.updateSchoolRecord}
          onDeleteSchoolRecord={actions.deleteSchoolRecord}
          onCreateDiscount={actions.createDiscountRecord}
          onUpdateDiscountRecord={actions.updateDiscountRecord}
          onDeleteDiscountRecord={actions.deleteDiscountRecord}
          onCreateAnnouncement={actions.createAnnouncementRecord}
          onUpdateAnnouncementRecord={actions.updateAnnouncementRecord}
          onDeleteAnnouncementRecord={actions.deleteAnnouncementRecord}
          onUpdateCurriculum={actions.updateCurriculum}
          onImportCurriculum={actions.importCurriculum}
        />
      );
    case 'dashboard':
    default:
      return (
        <DashboardScreen
          banner={state.dashboardBanner}
          pendingAssignments={state.pendingAssignments}
          subjects={state.subjects}
          onOpenSubject={actions.openSubject}
          onOpenFeature={actions.openFeature}
          onBannerAction={actions.openBannerAction}
        />
      );
  }
}

function getTitle(view: string, subjectName?: string) {
  if (view === 'subject' && subjectName) {
    return subjectName;
  }

  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    homework_list: 'Homework',
    homework_quiz: 'Homework Quiz',
    bookshelf_view: 'Bookshelf',
    reading_mode: 'Reader',
    lets_learn_list: 'Curriculum',
    lets_learn_content: 'Lesson',
    brain_tease: 'Brain Tease',
    take_quiz: 'Take Quiz',
    quiz_me_config: 'QuizMe',
    live_audio: 'Live Tutor',
    game_zone: 'Game Zone',
    quack_game: 'Quack!',
    crazy_balloon: 'Crazy Balloon',
    podcasts_view: 'Podcasts',
    teachers_portal: 'Teacher Portal',
    admin_portal: 'Admin Portal',
  };

  return titles[view] || 'Kitabu';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  bootstrapWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb',
  },
  bootstrapLogo: {
    width: 128,
    height: 128,
    opacity: 0.96,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  brand: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pageTitle: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
  },
  screenWrap: {
    flex: 1,
  },
  comingSoonOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonPill: {
    backgroundColor: 'rgba(15,23,42,0.92)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
