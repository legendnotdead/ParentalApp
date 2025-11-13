package com.parentalcontrol.parent.unit.viewmodel

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.parentalcontrol.parent.ui.dashboard.DashboardViewModel
import com.parentalcontrol.parent.data.repository.LocationRepository
import com.parentalcontrol.parent.data.repository.ScreenTimeRepository
import com.parentalcontrol.parent.data.repository.CommunicationRepository
import com.parentalcontrol.parent.domain.models.LocationData
import com.parentalcontrol.parent.domain.models.ScreenTimeData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.first
import org.mockito.Mockito.`when`

@ExperimentalCoroutinesApi
class DashboardViewModelTest {

    @get:Rule
    val instantExecutorRule = InstantTaskExecutorRule()

    @Mock
    private lateinit var locationRepository: LocationRepository

    @Mock
    private lateinit var screenTimeRepository: ScreenTimeRepository

    @Mock
    private lateinit var communicationRepository: CommunicationRepository

    private lateinit var viewModel: DashboardViewModel

    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        Dispatchers.setMain(testDispatcher)

        viewModel = DashboardViewModel(
            locationRepository,
            screenTimeRepository,
            communicationRepository
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadDashboardData should update livedata when repositories return data`() = runTest {
        // Given
        val expectedLocation = LocationData(37.7749, -122.4194, "Home")
        val expectedScreenTime = ScreenTimeData(120, emptyList())
        val expectedComms = emptyList<com.parentalcontrol.parent.domain.models.CommunicationData>()

        `when`(locationRepository.getCurrentLocation()).thenReturn(flowOf(expectedLocation))
        `when`(screenTimeRepository.getTodayUsage()).thenReturn(flowOf(expectedScreenTime))
        `when`(communicationRepository.getRecentCommunications()).thenReturn(flowOf(expectedComms))

        // When
        viewModel.loadDashboardData()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assert(viewModel.locationData.value == expectedLocation)
        assert(viewModel.screenTimeData.value == expectedScreenTime)
        assert(viewModel.communicationData.value == expectedComms)
        assert(viewModel.isLoading.value == false)
    }

    @Test
    fun `loadDashboardData should set loading state correctly`() = runTest {
        // Given
        `when`(locationRepository.getCurrentLocation()).thenReturn(flowOf())
        `when`(screenTimeRepository.getTodayUsage()).thenReturn(flowOf())
        `when`(communicationRepository.getRecentCommunications()).thenReturn(flowOf())

        // Initially loading should be true
        assert(viewModel.isLoading.value == true)

        // When
        viewModel.loadDashboardData()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assert(viewModel.isLoading.value == false)
    }

    @Test
    fun `refreshData should trigger data reload`() = runTest {
        // Given
        val expectedLocation = LocationData(37.7749, -122.4194, "Home")
        `when`(locationRepository.getCurrentLocation()).thenReturn(flowOf(expectedLocation))
        `when`(screenTimeRepository.getTodayUsage()).thenReturn(flowOf())
        `when`(communicationRepository.getRecentCommunications()).thenReturn(flowOf())

        // When
        viewModel.refreshData()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assert(viewModel.locationData.value == expectedLocation)
        assert(viewModel.isRefreshing.value == false)
    }
}